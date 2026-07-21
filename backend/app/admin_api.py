"""Панель управления: каталог, заказы, пользователи, журнал, сводка.

Каждый эндпоинт объявляет нужное право через Depends(require(...)). Правки
каталога проверяются пополю: цена, контент и остаток — разные права.
"""

from datetime import timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session as DbSession

from . import permissions as perm
from . import publishing
from .admin_schemas import (
    AdminOrderDetail,
    AdminOrderList,
    AdminOrderRow,
    AdminProductDetail,
    AdminProductList,
    AdminProductRow,
    AuditView,
    DashboardStats,
    LoginRequest,
    Me,
    OrderItemsPatch,
    OrderManagePatch,
    OrderStatusPatch,
    ProductPatch,
    RoleView,
    RoleWrite,
    UserCreate,
    UserUpdate,
    UserView,
)
from .database import get_db
from .models import (
    CANCEL_REASONS,
    CLOSING_STATUSES,
    AuditLog,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    Role,
    User,
    utc_now,
)
from .security import (
    close_session,
    current_user,
    find_user,
    hash_password,
    is_locked,
    log_action,
    open_session,
    register_failure,
    register_success,
    require,
    user_permissions,
    verify_password,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Какое право открывает какое поле карточки товара.
FIELD_PERMISSIONS: dict[str, str] = {
    "title": perm.CATALOG_CONTENT,
    "description": perm.CATALOG_CONTENT,
    "images": perm.CATALOG_CONTENT,
    "attrs": perm.CATALOG_CONTENT,
    "brand": perm.CATALOG_CONTENT,
    "price": perm.CATALOG_PRICE,
    "old_price": perm.CATALOG_PRICE,
    "on_sale": perm.CATALOG_PRICE,
    "in_stock": perm.CATALOG_STOCK,
    "active": perm.CATALOG_CREATE,
}


# ─── вход ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Me)
def login(payload: LoginRequest, response: Response, db: DbSession = Depends(get_db)) -> Me:
    user = find_user(db, payload.login.strip())
    # Одинаковый ответ на неверный логин и неверный пароль — не подсказываем, чей логин существует.
    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    if not user or not user.active:
        raise invalid
    if is_locked(user):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много попыток входа. Повторите через 15 минут",
        )
    if not verify_password(payload.password, user.password_hash):
        register_failure(db, user)
        raise invalid
    register_success(db, user)
    open_session(db, user, response)
    return me(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    dush_admin: str | None = Cookie(default=None),
    db: DbSession = Depends(get_db),
) -> None:
    close_session(db, dush_admin, response)


@router.get("/me", response_model=Me)
def me(user: User = Depends(current_user)) -> Me:
    return Me(
        id=user.id,
        login=user.login,
        name=user.name,
        role=user.role.slug,
        role_title=user.role.title,
        permissions=user_permissions(user),
    )


@router.get("/permissions")
def permission_catalog(user: User = Depends(require(perm.USERS_MANAGE))) -> dict[str, str]:
    return perm.ALL_PERMISSIONS


# ─── каталог ───────────────────────────────────────────────────────────────

def _row(product: Product) -> AdminProductRow:
    return AdminProductRow.model_validate(product)


@router.get("/products", response_model=AdminProductList)
def admin_products(
    q: str | None = Query(default=None, max_length=100),
    category: str | None = None,
    brand: str | None = None,
    only_inactive: bool = False,
    only_out_of_stock: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.CATALOG_VIEW)),
) -> AdminProductList:
    conditions = []
    if q:
        term = f"%{q.strip()}%"
        conditions.append(Product.title.ilike(term) | Product.sku.ilike(term) | Product.slug.ilike(term))
    if category:
        conditions.append(Product.category == category)
    if brand:
        conditions.append(Product.brand == brand)
    if only_inactive:
        conditions.append(Product.active.is_(False))
    if only_out_of_stock:
        conditions.append(Product.in_stock.is_(False))

    total = db.scalar(select(func.count()).select_from(Product).where(*conditions)) or 0
    rows = db.scalars(
        select(Product)
        .where(*conditions)
        .order_by(Product.updated_at.desc(), Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminProductList(items=[_row(p) for p in rows], total=total, page=page, page_size=page_size)


@router.get("/products/{product_id}", response_model=AdminProductDetail)
def admin_product(
    product_id: int,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.CATALOG_VIEW)),
) -> AdminProductDetail:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return AdminProductDetail.model_validate(product)


@router.patch("/products/{product_id}", response_model=AdminProductDetail)
def patch_product(
    product_id: int,
    payload: ProductPatch,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.CATALOG_VIEW)),
) -> AdminProductDetail:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    fields = payload.model_dump(exclude_unset=True)
    denied = sorted({FIELD_PERMISSIONS[f] for f in fields if not user.can(FIELD_PERMISSIONS[f])})
    if denied:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Нет прав на изменение: {', '.join(perm.ALL_PERMISSIONS[p] for p in denied)}",
        )

    changes: dict[str, dict] = {}
    for field, value in fields.items():
        before = getattr(product, field)
        if before == value:
            continue
        setattr(product, field, value)
        changes[field] = {"from": _plain(before), "to": _plain(value)}

    if changes:
        # Отмечаем поле ручным, чтобы импорт каталога не вернул старое значение.
        product.manual_fields = sorted(set(product.manual_fields or []) | set(changes))
        log_action(db, user, "update", "product", product.id, changes)
        db.commit()
        db.refresh(product)
    return AdminProductDetail.model_validate(product)


def _plain(value):
    """Значение для журнала: длинные тексты режем, Decimal приводим к строке."""
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, str) and len(value) > 300:
        return value[:300] + "…"
    return value


# ─── заказы ────────────────────────────────────────────────────────────────

def _order_row(order: Order) -> AdminOrderRow:
    row = AdminOrderRow.model_validate(order)
    row.manager_name = order.manager.name or order.manager.login if order.manager else ""
    return row


@router.get("/orders", response_model=AdminOrderList)
def admin_orders(
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=100),
    manager_id: int | None = None,
    days: int | None = Query(default=None, ge=1, le=730),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_VIEW)),
) -> AdminOrderList:
    conditions = []
    if status_filter:
        conditions.append(Order.status == status_filter)
    if manager_id:
        conditions.append(Order.manager_id == manager_id)
    if days:
        conditions.append(Order.created_at >= utc_now() - timedelta(days=days))
    if q:
        term = f"%{q.strip()}%"
        conditions.append(Order.customer_name.ilike(term) | Order.phone.ilike(term))

    total = db.scalar(select(func.count()).select_from(Order).where(*conditions)) or 0
    rows = db.scalars(
        select(Order)
        .where(*conditions)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminOrderList(items=[_order_row(o) for o in rows], total=total, page=page, page_size=page_size)


@router.get("/orders/cancel-reasons")
def cancel_reasons(user: User = Depends(require(perm.ORDERS_VIEW))) -> list[str]:
    return list(CANCEL_REASONS)


@router.get("/orders/{order_id}", response_model=AdminOrderDetail)
def admin_order(
    order_id: UUID,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_VIEW)),
) -> AdminOrderDetail:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    detail = AdminOrderDetail.model_validate(order)
    detail.manager_name = order.manager.name or order.manager.login if order.manager else ""
    return detail


@router.patch("/orders/{order_id}/status", response_model=AdminOrderDetail)
def patch_order_status(
    order_id: UUID,
    payload: OrderStatusPatch,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_STATUS)),
) -> AdminOrderDetail:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if payload.status in CLOSING_STATUSES and not payload.reason.strip():
        raise HTTPException(status_code=422, detail="Для отмены и возврата нужна причина")

    before = order.status
    order.status = payload.status
    if payload.status in CLOSING_STATUSES:
        order.closing_reason = payload.reason.strip()
    log_action(
        db, user, "status", "order", order.id,
        {"status": {"from": before.value, "to": payload.status.value}, "reason": payload.reason},
    )
    db.commit()
    db.refresh(order)
    return admin_order(order_id, db, user)


@router.patch("/orders/{order_id}", response_model=AdminOrderDetail)
def patch_order_manage(
    order_id: UUID,
    payload: OrderManagePatch,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_STATUS)),
) -> AdminOrderDetail:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    fields = payload.model_dump(exclude_unset=True)
    changes = {}
    if "manager_id" in fields:
        if fields["manager_id"] is not None and not db.get(User, fields["manager_id"]):
            raise HTTPException(status_code=422, detail="Сотрудник не найден")
        changes["manager_id"] = {"from": order.manager_id, "to": fields["manager_id"]}
        order.manager_id = fields["manager_id"]
    if "manager_note" in fields:
        changes["manager_note"] = {"from": _plain(order.manager_note), "to": _plain(fields["manager_note"])}
        order.manager_note = fields["manager_note"]
    if changes:
        log_action(db, user, "update", "order", order.id, changes)
        db.commit()
    return admin_order(order_id, db, user)


@router.put("/orders/{order_id}/items", response_model=AdminOrderDetail)
def replace_order_items(
    order_id: UUID,
    payload: OrderItemsPatch,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_EDIT)),
) -> AdminOrderDetail:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    slugs = [item.slug for item in payload.items]
    products = {p.slug: p for p in db.scalars(select(Product).where(Product.slug.in_(slugs))).all()}
    missing = sorted(set(slugs) - set(products))
    if missing:
        raise HTTPException(status_code=422, detail={"missing_products": missing})

    was = {"total": str(order.total), "positions": len(order.items)}
    order.items.clear()
    db.flush()
    total = Decimal("0")
    for item in payload.items:
        product = products[item.slug]
        unit_price = item.unit_price if item.unit_price is not None else product.price
        line_total = unit_price * item.quantity
        total += line_total
        order.items.append(
            OrderItem(
                product_id=product.id,
                slug=product.slug,
                sku=product.sku,
                title=product.title,
                unit_price=unit_price,
                quantity=item.quantity,
                line_total=line_total,
            )
        )
    order.total = total
    log_action(
        db, user, "items", "order", order.id,
        {"total": {"from": was["total"], "to": str(total)},
         "positions": {"from": was["positions"], "to": len(payload.items)}},
    )
    db.commit()
    return admin_order(order_id, db, user)


# ─── пользователи и роли ───────────────────────────────────────────────────

@router.get("/roles", response_model=list[RoleView])
def list_roles(
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id)).all())


@router.post("/roles", response_model=RoleView, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleWrite,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> Role:
    slug = payload.title.strip().lower().replace(" ", "-")[:50]
    if db.scalar(select(Role).where(Role.slug == slug)):
        raise HTTPException(status_code=409, detail="Роль с таким названием уже есть")
    role = Role(slug=slug, title=payload.title.strip(), permissions=_valid_perms(payload.permissions))
    db.add(role)
    log_action(db, user, "create", "role", slug, {"permissions": {"from": [], "to": role.permissions}})
    db.commit()
    return role


@router.put("/roles/{role_id}", response_model=RoleView)
def update_role(
    role_id: int,
    payload: RoleWrite,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> Role:
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    if role.system:
        raise HTTPException(status_code=403, detail="Системную роль изменить нельзя")
    before = list(role.permissions or [])
    role.title = payload.title.strip()
    role.permissions = _valid_perms(payload.permissions)
    log_action(db, user, "update", "role", role.slug, {"permissions": {"from": before, "to": role.permissions}})
    db.commit()
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> None:
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    if role.system:
        raise HTTPException(status_code=403, detail="Системную роль удалить нельзя")
    if db.scalar(select(func.count()).select_from(User).where(User.role_id == role_id)):
        raise HTTPException(status_code=409, detail="Роль назначена сотрудникам")
    log_action(db, user, "delete", "role", role.slug, {})
    db.delete(role)
    db.commit()


def _valid_perms(values: list[str]) -> list[str]:
    unknown = sorted(set(values) - set(perm.ALL_PERMISSIONS))
    if unknown:
        raise HTTPException(status_code=422, detail=f"Неизвестные права: {', '.join(unknown)}")
    return [p for p in perm.ALL_PERMISSIONS if p in set(values)]


@router.get("/users", response_model=list[UserView])
def list_users(
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.get("/users/assignable", response_model=list[UserView])
def assignable_users(
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ORDERS_VIEW)),
) -> list[User]:
    """Кого можно назначить ответственным за заказ — доступно всем, кто видит заказы."""
    return list(db.scalars(select(User).where(User.active.is_(True)).order_by(User.name, User.login)).all())


@router.post("/users", response_model=UserView, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> User:
    if find_user(db, payload.login):
        raise HTTPException(status_code=409, detail="Логин занят")
    if not db.get(Role, payload.role_id):
        raise HTTPException(status_code=422, detail="Роль не найдена")
    created = User(
        login=payload.login,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        role_id=payload.role_id,
    )
    db.add(created)
    db.flush()
    log_action(db, user, "create", "user", created.login, {"role_id": {"from": None, "to": payload.role_id}})
    db.commit()
    return created


@router.patch("/users/{user_id}", response_model=UserView)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.USERS_MANAGE)),
) -> User:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    fields = payload.model_dump(exclude_unset=True)
    if fields.get("active") is False and target.id == user.id:
        raise HTTPException(status_code=422, detail="Нельзя заблокировать самого себя")

    changes: dict[str, dict] = {}
    if "name" in fields:
        changes["name"] = {"from": target.name, "to": fields["name"]}
        target.name = fields["name"]
    if fields.get("role_id"):
        if not db.get(Role, fields["role_id"]):
            raise HTTPException(status_code=422, detail="Роль не найдена")
        changes["role_id"] = {"from": target.role_id, "to": fields["role_id"]}
        target.role_id = fields["role_id"]
    if "active" in fields:
        changes["active"] = {"from": target.active, "to": fields["active"]}
        target.active = fields["active"]
        if not fields["active"]:
            _drop_sessions(db, target.id)
    if fields.get("password"):
        target.password_hash = hash_password(fields["password"])
        target.failed_attempts = 0
        target.locked_until = None
        changes["password"] = {"from": "•••", "to": "изменён"}
        _drop_sessions(db, target.id)

    if changes:
        log_action(db, user, "update", "user", target.login, changes)
        db.commit()
        db.refresh(target)
    return target


def _drop_sessions(db: DbSession, user_id: int) -> None:
    """Блокировка и смена пароля выкидывают сотрудника из панели сразу."""
    from .models import Session as UserSession

    db.execute(delete(UserSession).where(UserSession.user_id == user_id))


# ─── публикация витрины ────────────────────────────────────────────────────

@router.get("/publish")
def publish_state(
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.CATALOG_VIEW)),
) -> dict:
    return {**publishing.read_status(), **publishing.pending_changes(db), "can_publish": user.can(perm.PUBLISH)}


@router.post("/publish", status_code=status.HTTP_202_ACCEPTED)
def publish(
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.PUBLISH)),
) -> dict:
    if publishing.is_busy():
        raise HTTPException(status_code=409, detail="Публикация уже идёт")
    try:
        publishing.request_publish(user.login)
    except OSError:
        raise HTTPException(status_code=503, detail="Служба публикации недоступна") from None
    log_action(db, user, "publish", "storefront", "-", {})
    db.commit()
    return publishing.read_status()


@router.get("/publish/log")
def publish_log(user: User = Depends(require(perm.PUBLISH))) -> dict:
    return {"log": publishing.tail_log()}


# ─── журнал и сводка ───────────────────────────────────────────────────────

@router.get("/audit", response_model=list[AuditView])
def audit(
    entity: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.AUDIT_VIEW)),
) -> list[AuditLog]:
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if entity:
        query = query.where(AuditLog.entity == entity)
    return list(db.scalars(query).all())


@router.get("/stats", response_model=DashboardStats)
def stats(
    days: int = Query(default=30, ge=1, le=365),
    db: DbSession = Depends(get_db),
    user: User = Depends(require(perm.ANALYTICS_VIEW)),
) -> DashboardStats:
    since = utc_now() - timedelta(days=days)
    paid = [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.CONFIRMED]

    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.created_at >= since, Order.status.in_(paid))
    ) or Decimal("0")
    orders_count = db.scalar(select(func.count()).select_from(Order).where(Order.created_at >= since)) or 0
    paid_count = (
        db.scalar(select(func.count()).select_from(Order).where(Order.created_at >= since, Order.status.in_(paid)))
        or 0
    )
    by_status = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in db.execute(
            select(Order.status, func.count()).where(Order.created_at >= since).group_by(Order.status)
        ).all()
    }
    top = db.execute(
        select(OrderItem.title, func.sum(OrderItem.quantity), func.sum(OrderItem.line_total))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= since)
        .group_by(OrderItem.title)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(10)
    ).all()
    reasons = db.execute(
        select(Order.closing_reason, func.count())
        .where(Order.created_at >= since, Order.status.in_(list(CLOSING_STATUSES)), Order.closing_reason != "")
        .group_by(Order.closing_reason)
        .order_by(func.count().desc())
    ).all()
    out_of_stock = (
        db.scalar(
            select(func.count()).select_from(Product).where(Product.active.is_(True), Product.in_stock.is_(False))
        )
        or 0
    )

    return DashboardStats(
        revenue=revenue,
        orders=orders_count,
        average_check=(revenue / paid_count) if paid_count else Decimal("0"),
        cancelled=by_status.get(OrderStatus.CANCELLED.value, 0) + by_status.get(OrderStatus.RETURNED.value, 0),
        by_status=by_status,
        top_products=[{"title": t, "qty": int(q), "revenue": str(r)} for t, q, r in top],
        cancel_reasons=[{"reason": r, "count": c} for r, c in reasons],
        out_of_stock=out_of_stock,
    )

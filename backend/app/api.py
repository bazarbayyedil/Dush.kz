import hashlib
import hmac
import secrets
import time
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import Order, OrderItem, OrderStatus, Product
from .schemas import (
    AdminLogin,
    AdminProduct,
    AdminProductList,
    AdminProductUpdate,
    AdminSession,
    AdminSummary,
    CatalogFacets,
    FacetItem,
    OrderCreate,
    OrderCreated,
    OrderStatusUpdate,
    OrderView,
    ProductDetail,
    ProductList,
    ProductSummary,
)

router = APIRouter(prefix="/api/v1")
ADMIN_COOKIE_NAME = "dush_admin_session"
ADMIN_SESSION_MAX_AGE = 60 * 60 * 8


def product_summary(product: Product) -> ProductSummary:
    return ProductSummary(
        **{
            column: getattr(product, column)
            for column in (
                "slug",
                "sku",
                "title",
                "brand",
                "category",
                "category_title",
                "price",
                "old_price",
                "in_stock",
                "on_sale",
            )
        },
        image=product.images[0] if product.images else "",
    )


def admin_product(product: Product) -> AdminProduct:
    return AdminProduct(**product_summary(product).model_dump(), active=product.active)


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(select(1))
    return {"status": "ok"}


@router.get("/products", response_model=ProductList)
def list_products(
    q: str | None = Query(default=None, max_length=100),
    brand: list[str] = Query(default=[]),
    category: list[str] = Query(default=[]),
    price_min: Decimal | None = Query(default=None, ge=0),
    price_max: Decimal | None = Query(default=None, ge=0),
    in_stock: bool | None = None,
    on_sale: bool | None = None,
    sort: str = Query(default="popular", pattern="^(popular|price_asc|price_desc|name)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=48, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ProductList:
    conditions = [Product.active.is_(True)]
    if q:
        term = f"%{q.strip()}%"
        conditions.append(or_(Product.title.ilike(term), Product.sku.ilike(term), Product.brand.ilike(term)))
    if brand:
        conditions.append(Product.brand.in_(brand))
    if category:
        conditions.append(Product.category.in_(category))
    if price_min is not None:
        conditions.append(Product.price >= price_min)
    if price_max is not None:
        conditions.append(Product.price <= price_max)
    if in_stock is not None:
        conditions.append(Product.in_stock.is_(in_stock))
    if on_sale is not None:
        conditions.append(Product.on_sale.is_(on_sale))

    ordering = {
        "popular": (Product.in_stock.desc(), Product.on_sale.desc(), Product.id.asc()),
        "price_asc": (Product.price.asc(),),
        "price_desc": (Product.price.desc(),),
        "name": (Product.title.asc(),),
    }[sort]
    total = db.scalar(select(func.count()).select_from(Product).where(*conditions)) or 0
    rows = db.scalars(
        select(Product).where(*conditions).order_by(*ordering).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return ProductList(
        items=[product_summary(product) for product in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/products/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductDetail:
    product = db.scalar(select(Product).where(Product.slug == slug, Product.active.is_(True)))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductDetail(
        **product_summary(product).model_dump(),
        images=product.images,
        attrs=product.attrs,
        description=product.description,
    )


@router.get("/catalog/facets", response_model=CatalogFacets)
def catalog_facets(db: Session = Depends(get_db)) -> CatalogFacets:
    brands = db.execute(
        select(Product.brand, func.count())
        .where(Product.active.is_(True))
        .group_by(Product.brand)
        .order_by(func.count().desc())
    ).all()
    categories = db.execute(
        select(Product.category, Product.category_title, func.count())
        .where(Product.active.is_(True))
        .group_by(Product.category, Product.category_title)
        .order_by(func.count().desc())
    ).all()
    price_min, price_max = db.execute(
        select(func.min(Product.price), func.max(Product.price)).where(Product.active.is_(True))
    ).one()
    return CatalogFacets(
        brands=[FacetItem(value=value, count=count) for value, count in brands],
        categories=[FacetItem(value=value, title=title, count=count) for value, title, count in categories],
        price_min=price_min,
        price_max=price_max,
    )


@router.post("/orders", response_model=OrderCreated, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> OrderCreated:
    quantities: dict[str, int] = {}
    for item in payload.items:
        quantities[item.slug] = quantities.get(item.slug, 0) + item.quantity
    products = db.scalars(select(Product).where(Product.slug.in_(quantities), Product.active.is_(True))).all()
    by_slug = {product.slug: product for product in products}
    missing = sorted(set(quantities) - set(by_slug))
    if missing:
        raise HTTPException(status_code=422, detail={"missing_products": missing})

    order = Order(
        customer_name=payload.customer_name,
        phone=payload.phone,
        city=payload.city,
        comment=payload.comment,
        total=Decimal("0"),
    )
    for slug, quantity in quantities.items():
        product = by_slug[slug]
        line_total = product.price * quantity
        order.total += line_total
        order.items.append(
            OrderItem(
                product_id=product.id,
                slug=product.slug,
                sku=product.sku,
                title=product.title,
                unit_price=product.price,
                quantity=quantity,
                line_total=line_total,
            )
        )
    db.add(order)
    db.commit()
    return OrderCreated(id=order.id, status=order.status, total=order.total)


def admin_session_value(admin_token: str) -> str:
    expires_at = int(time.time()) + ADMIN_SESSION_MAX_AGE
    payload = str(expires_at)
    signature = hmac.new(admin_token.encode(), f"dush-admin-session-v1:{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def admin_session_valid(cookie: str, admin_token: str) -> bool:
    expires_at, separator, supplied_signature = cookie.partition(".")
    if not separator or not expires_at.isdigit() or int(expires_at) < int(time.time()):
        return False
    expected_signature = hmac.new(
        admin_token.encode(), f"dush-admin-session-v1:{expires_at}".encode(), hashlib.sha256
    ).hexdigest()
    return secrets.compare_digest(supplied_signature, expected_signature)


def require_admin(request: Request, authorization: str | None = Header(default=None)) -> None:
    expected = get_settings().admin_token
    bearer = authorization.removeprefix("Bearer ") if authorization else ""
    cookie = request.cookies.get(ADMIN_COOKIE_NAME, "")
    bearer_valid = bool(expected and secrets.compare_digest(bearer, expected))
    cookie_valid = bool(expected and admin_session_valid(cookie, expected))
    if not bearer_valid and not cookie_valid:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/admin/login", response_model=AdminSession)
def admin_login(payload: AdminLogin, response: Response) -> AdminSession:
    settings = get_settings()
    if not settings.admin_token or not secrets.compare_digest(payload.password, settings.admin_token):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=admin_session_value(settings.admin_token),
        max_age=ADMIN_SESSION_MAX_AGE,
        httponly=True,
        secure=settings.environment == "production",
        samesite="strict",
        path="/",
    )
    return AdminSession(authenticated=True)


@router.post("/admin/logout", response_model=AdminSession)
def admin_logout(response: Response) -> AdminSession:
    response.delete_cookie(ADMIN_COOKIE_NAME, path="/")
    return AdminSession(authenticated=False)


@router.get("/admin/session", response_model=AdminSession, dependencies=[Depends(require_admin)])
def admin_session() -> AdminSession:
    return AdminSession(authenticated=True)


@router.get("/admin/summary", response_model=AdminSummary, dependencies=[Depends(require_admin)])
def admin_summary(db: Session = Depends(get_db)) -> AdminSummary:
    return AdminSummary(
        products_total=db.scalar(select(func.count()).select_from(Product)) or 0,
        products_active=db.scalar(select(func.count()).select_from(Product).where(Product.active.is_(True))) or 0,
        products_in_stock=db.scalar(select(func.count()).select_from(Product).where(Product.in_stock.is_(True))) or 0,
        orders_total=db.scalar(select(func.count()).select_from(Order)) or 0,
        orders_new=db.scalar(select(func.count()).select_from(Order).where(Order.status == OrderStatus.NEW)) or 0,
        orders_revenue=db.scalar(select(func.coalesce(func.sum(Order.total), 0))) or Decimal("0"),
    )


@router.get("/admin/orders", response_model=list[OrderView], dependencies=[Depends(require_admin)])
def list_orders(
    order_status: str | None = Query(default=None, alias="status", pattern="^(new|confirmed|cancelled|completed)$"),
    db: Session = Depends(get_db),
) -> list[Order]:
    query = select(Order)
    if order_status:
        query = query.where(Order.status == OrderStatus(order_status))
    return list(db.scalars(query.order_by(Order.created_at.desc()).limit(100)).all())


@router.patch("/admin/orders/{order_id}", response_model=OrderView, dependencies=[Depends(require_admin)])
def update_order_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.get("/admin/products", response_model=AdminProductList, dependencies=[Depends(require_admin)])
def list_admin_products(
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
) -> AdminProductList:
    conditions = []
    if q:
        term = f"%{q.strip()}%"
        conditions.append(or_(Product.title.ilike(term), Product.sku.ilike(term), Product.brand.ilike(term)))
    total = db.scalar(select(func.count()).select_from(Product).where(*conditions)) or 0
    products = db.scalars(
        select(Product)
        .where(*conditions)
        .order_by(Product.updated_at.desc(), Product.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AdminProductList(
        items=[admin_product(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/admin/products/{slug}", response_model=AdminProduct, dependencies=[Depends(require_admin)])
def update_admin_product(
    slug: str,
    payload: AdminProductUpdate,
    db: Session = Depends(get_db),
) -> AdminProduct:
    product = db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return admin_product(product)

from decimal import Decimal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Order, OrderItem, Product
from .schemas import (
    CatalogFacets,
    FacetItem,
    OrderCreate,
    OrderCreated,
    ProductDetail,
    ProductList,
    ProductSummary,
)
from .telegram import build_message, notify_order

router = APIRouter(prefix="/api/v1")


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
def create_order(
    payload: OrderCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
) -> OrderCreated:
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
        shipping=payload.shipping,
        payment_method=payload.payment_method,
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

    # Текст собираем сейчас, пока данные под рукой; отправку — в фон, чтобы
    # ответ клиенту не ждал Telegram.
    background.add_task(notify_order, build_message(order))
    return OrderCreated(id=order.id, status=order.status, total=order.total)



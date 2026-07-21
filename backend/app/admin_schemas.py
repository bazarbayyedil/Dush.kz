from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import OrderStatus


class LoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class Me(BaseModel):
    id: int
    login: str
    name: str
    role: str
    role_title: str
    permissions: list[str]


class RoleView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    permissions: list[str]
    system: bool


class RoleWrite(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    permissions: list[str] = Field(default_factory=list)


class UserView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    login: str
    name: str
    active: bool
    role_id: int
    last_login_at: datetime | None


class UserCreate(BaseModel):
    login: str = Field(min_length=3, max_length=80, pattern=r"^[a-zA-Z0-9._-]+$")
    name: str = Field(default="", max_length=120)
    password: str = Field(min_length=10, max_length=200)
    role_id: int


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    password: str | None = Field(default=None, min_length=10, max_length=200)
    role_id: int | None = None
    active: bool | None = None


class AdminProductRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    sku: str
    title: str
    brand: str
    category: str
    category_title: str
    price: Decimal
    old_price: Decimal | None
    in_stock: bool
    on_sale: bool
    active: bool
    images: list[str]
    updated_at: datetime


class AdminProductDetail(AdminProductRow):
    attrs: dict[str, str]
    description: str


class AdminProductList(BaseModel):
    items: list[AdminProductRow]
    total: int
    page: int
    page_size: int


class ProductPatch(BaseModel):
    """Все поля необязательны: право проверяется по факту присланного поля."""

    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=20000)
    images: list[str] | None = None
    attrs: dict[str, str] | None = None
    brand: str | None = Field(default=None, max_length=255)
    price: Decimal | None = Field(default=None, ge=0, le=Decimal("99999999"))
    old_price: Decimal | None = Field(default=None, ge=0, le=Decimal("99999999"))
    in_stock: bool | None = None
    on_sale: bool | None = None
    active: bool | None = None

    @field_validator("images")
    @classmethod
    def check_images(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        if len(value) > 20:
            raise ValueError("не больше 20 изображений")
        for url in value:
            if not url.startswith("/") or ".." in url:
                raise ValueError("ожидается путь вида /products/<slug>/1.jpeg")
        return value


class OrderItemView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    sku: str
    title: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class PaymentView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    amount: Decimal
    refunded_amount: Decimal
    card_mask: str
    card_type: str
    failure_reason: str
    paid_at: datetime | None
    created_at: datetime


class AdminOrderRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: OrderStatus
    payment_status: str
    customer_name: str
    phone: str
    city: str
    total: Decimal
    manager_id: int | None
    manager_name: str = ""
    created_at: datetime


class AdminOrderDetail(AdminOrderRow):
    comment: str
    manager_note: str
    closing_reason: str
    shipping: str
    payment_method: str
    source: str
    updated_at: datetime
    items: list[OrderItemView]
    payments: list[PaymentView] = []


class AdminOrderList(BaseModel):
    items: list[AdminOrderRow]
    total: int
    page: int
    page_size: int


class OrderStatusPatch(BaseModel):
    status: OrderStatus
    reason: str = Field(default="", max_length=120)


class OrderManagePatch(BaseModel):
    manager_id: int | None = None
    manager_note: str | None = Field(default=None, max_length=4000)


class OrderItemsPatch(BaseModel):
    items: list["OrderItemWrite"] = Field(min_length=0, max_length=50)


class OrderItemWrite(BaseModel):
    slug: str = Field(min_length=1, max_length=255)
    quantity: int = Field(ge=1, le=999)
    unit_price: Decimal | None = Field(default=None, ge=0)


class AuditView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_login: str
    action: str
    entity: str
    entity_id: str
    changes: dict
    created_at: datetime


class DashboardStats(BaseModel):
    revenue: Decimal
    orders: int
    average_check: Decimal
    cancelled: int
    by_status: dict[str, int]
    top_products: list[dict]
    cancel_reasons: list[dict]
    out_of_stock: int


OrderItemsPatch.model_rebuild()

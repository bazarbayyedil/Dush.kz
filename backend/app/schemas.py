from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import OrderStatus


class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
    image: str = ""


class ProductDetail(ProductSummary):
    images: list[str]
    attrs: dict[str, str]
    description: str


class ProductList(BaseModel):
    items: list[ProductSummary]
    total: int
    page: int
    page_size: int


class FacetItem(BaseModel):
    value: str
    title: str | None = None
    count: int


class CatalogFacets(BaseModel):
    brands: list[FacetItem]
    categories: list[FacetItem]
    price_min: Decimal | None
    price_max: Decimal | None


class OrderItemCreate(BaseModel):
    slug: str = Field(min_length=1, max_length=255)
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=10, max_length=32)
    city: str = Field(default="", max_length=80)
    comment: str = Field(default="", max_length=500)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)

    @field_validator("customer_name", "phone", "city", "comment")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = "".join(char for char in value if char.isdigit())
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("invalid phone number")
        return "+" + digits


class OrderCreated(BaseModel):
    id: UUID
    status: OrderStatus
    total: Decimal


class OrderView(OrderCreated):
    model_config = ConfigDict(from_attributes=True)

    customer_name: str
    phone: str
    city: str
    comment: str

import uuid
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from .database import Base

json_type = JSON().with_variant(JSONB(), "postgresql")


def utc_now() -> datetime:
    return datetime.now(UTC)


class OrderStatus(StrEnum):
    NEW = "new"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(100), index=True, default="")
    title: Mapped[str] = mapped_column(String(500), index=True)
    brand: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(255), index=True)
    category_title: Mapped[str] = mapped_column(String(255))
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    old_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    on_sale: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    images: Mapped[list[str]] = mapped_column(json_type, default=list)
    attrs: Mapped[dict[str, str]] = mapped_column(json_type, default=dict)
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    __table_args__ = (Index("ix_products_catalog", "active", "category", "brand"),)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), default=OrderStatus.NEW, index=True
    )
    customer_name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(32), index=True)
    city: Mapped[str] = mapped_column(String(80), default="")
    comment: Mapped[str] = mapped_column(String(500), default="")
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), nullable=True)
    slug: Mapped[str] = mapped_column(String(255))
    sku: Mapped[str] = mapped_column(String(100), default="")
    title: Mapped[str] = mapped_column(String(500))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    quantity: Mapped[int] = mapped_column(Integer)
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    order: Mapped[Order] = relationship(back_populates="items")

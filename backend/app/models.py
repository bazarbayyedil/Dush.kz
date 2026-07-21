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
    PROCESSING = "processing"
    CONFIRMED = "confirmed"
    ASSEMBLED = "assembled"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RETURNED = "returned"


# Причина обязательна при отмене и возврате — без неё не собрать аналитику отказов.
CLOSING_STATUSES = frozenset({OrderStatus.CANCELLED, OrderStatus.RETURNED})

CANCEL_REASONS: tuple[str, ...] = (
    "Нет в наличии",
    "Клиент передумал",
    "Дорого / нашёл дешевле",
    "Не устроил срок доставки",
    "Дубль заказа",
    "Не дозвонились",
    "Брак или повреждение",
    "Другое",
)


# Статусы платежа и оплаты заказа хранятся строками, а не типом PostgreSQL:
# добавить новый статус тогда можно без ALTER TYPE и простоя.
class PaymentStatus(StrEnum):
    PENDING = "pending"          # ссылка выдана, деньги ещё не списаны
    AUTHORIZED = "authorized"    # средства захолдированы, ждут подтверждения
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class OrderPayment(StrEnum):
    UNPAID = "unpaid"            # оплата при получении или переводом
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


PAID_PAYMENT_STATUSES = frozenset({PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED})


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
    # Public URLs only. Image bytes live in persistent media storage or an object store.
    images: Mapped[list[str]] = mapped_column(json_type, default=list)
    attrs: Mapped[dict[str, str]] = mapped_column(json_type, default=dict)
    description: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    # Поля, отредактированные в панели. Импорт каталога их не перезаписывает —
    # иначе очередной релиз затирал бы ручную работу контент-менеджера.
    manual_fields: Mapped[list[str]] = mapped_column(json_type, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

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
    # Что клиент выбрал в форме — менеджеру не нужно переспрашивать по телефону.
    shipping: Mapped[str] = mapped_column(String(24), default="delivery", server_default="delivery")
    payment_method: Mapped[str] = mapped_column(String(24), default="cash", server_default="cash")
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    payment_status: Mapped[str] = mapped_column(
        String(24), default=OrderPayment.UNPAID, server_default=OrderPayment.UNPAID, index=True
    )
    source: Mapped[str] = mapped_column(String(120), default="", index=True)
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    manager_note: Mapped[str] = mapped_column(Text, default="")
    closing_reason: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    manager: Mapped["User | None"] = relationship(lazy="joined")
    payments: Mapped[list["Payment"]] = relationship(
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


class Payment(Base):
    """Платёж по заказу. Реквизиты карты сюда не попадают — только результат.

    Полный номер карты, срок и CVV остаются у платёжного оператора; храним
    маску и платёжную систему, этого хватает для возврата и разбора споров.
    """

    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(40), default="tiptoppay", index=True)
    # Номер счёта на стороне провайдера. Уникален: по нему ищем платёж из уведомления.
    invoice_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    transaction_id: Mapped[str] = mapped_column(String(64), default="", index=True)
    status: Mapped[str] = mapped_column(String(24), default=PaymentStatus.PENDING, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3), default="KZT")
    refunded_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    card_mask: Mapped[str] = mapped_column(String(32), default="")
    card_type: Mapped[str] = mapped_column(String(24), default="")
    failure_reason: Mapped[str] = mapped_column(String(255), default="")
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    order: Mapped[Order] = relationship(back_populates="payments")

    @property
    def refundable(self) -> Decimal:
        return self.amount - self.refunded_amount


class WebhookEvent(Base):
    """Отметка об обработанном уведомлении — провайдер повторяет их при таймауте.

    Без этой таблицы повторный `pay` записал бы оплату дважды.
    """

    __tablename__ = "webhook_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(40), default="tiptoppay")
    event: Mapped[str] = mapped_column(String(24))
    # Ключ повтора: у провайдера это TransactionId, уникален в паре с типом события.
    external_id: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    __table_args__ = (
        Index("ix_webhook_unique", "provider", "event", "external_id", unique=True),
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(120))
    # Плоский список прав из permissions.ALL_PERMISSIONS.
    permissions: Mapped[list[str]] = mapped_column(json_type, default=list)
    # Системную роль нельзя удалить или урезать: иначе можно остаться без владельца.
    system: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    role: Mapped[Role] = relationship(lazy="joined")

    def can(self, permission: str) -> bool:
        return self.active and permission in (self.role.permissions or [])


class Session(Base):
    __tablename__ = "sessions"

    # В cookie уходит сырой токен, в базе лежит только его хеш.
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    user: Mapped[User] = relationship(lazy="joined")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    user_login: Mapped[str] = mapped_column(String(80), default="")
    action: Mapped[str] = mapped_column(String(60), index=True)
    entity: Mapped[str] = mapped_column(String(60), index=True)
    entity_id: Mapped[str] = mapped_column(String(80), default="", index=True)
    # {поле: {"from": ..., "to": ...}} — только изменённые поля.
    changes: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    __table_args__ = (Index("ix_audit_recent", "created_at", "entity"),)

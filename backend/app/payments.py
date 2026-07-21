"""Платежи: подпись уведомлений, идемпотентность, отражение результата в заказе.

Здесь нет ни одного обращения к сети — только правила. Сетевые вызовы к
провайдеру живут в отдельном слое, чтобы эту логику можно было проверить тестами.
"""

import base64
import hashlib
import hmac
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from .config import get_settings
from .models import (
    Order,
    OrderPayment,
    Payment,
    PaymentStatus,
    WebhookEvent,
    utc_now,
)

PROVIDER = "tiptoppay"


def verify_signature(raw_body: bytes, header: str | None) -> bool:
    """Подпись уведомления: HMAC-SHA256 от тела запроса на API Secret.

    Без неё кто угодно, знающий адрес обработчика, мог бы объявить заказ оплаченным.
    """
    secret = get_settings().tiptop_api_secret
    if not secret or not header:
        return False
    digest = hmac.new(secret.encode(), raw_body, hashlib.sha256).digest()
    # Сравниваем байты: со строками compare_digest бросает TypeError на не-ASCII,
    # и подделанный заголовок с кириллицей превращался бы в 500 вместо отказа.
    return hmac.compare_digest(base64.b64encode(digest), header.strip().encode("utf-8", "ignore"))


def already_processed(db: DbSession, event: str, external_id: str, payload: dict) -> bool:
    """Отмечает уведомление обработанным. True — значит его уже принимали.

    Уникальный индекс делает проверку атомарной: два одновременных повтора
    не пройдут оба.
    """
    if not external_id:
        return False
    db.add(WebhookEvent(provider=PROVIDER, event=event, external_id=external_id, payload=payload))
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return True
    return False


def start_payment(db: DbSession, order: Order) -> Payment:
    """Создаёт запись платежа под заказ. Сумма берётся из базы, не от клиента."""
    existing = db.scalar(
        select(Payment).where(
            Payment.order_id == order.id,
            Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.AUTHORIZED]),
        )
    )
    if existing:
        return existing

    payment = Payment(
        order_id=order.id,
        invoice_id=str(order.id),
        amount=order.total,
        currency="KZT",
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    order.payment_status = OrderPayment.PENDING
    db.flush()
    return payment


def find_payment(db: DbSession, invoice_id: str, transaction_id: str = "") -> Payment | None:
    payment = db.scalar(select(Payment).where(Payment.invoice_id == invoice_id))
    if payment is None and transaction_id:
        payment = db.scalar(select(Payment).where(Payment.transaction_id == transaction_id))
    return payment


def amount_matches(payment: Payment, amount: Decimal) -> bool:
    """Сумму из уведомления сверяем с той, что записана в базе.

    Провайдеру мы доверяем в вопросе «прошли ли деньги», но не в вопросе «сколько».
    """
    return payment.amount == amount


def mark_paid(db: DbSession, payment: Payment, transaction_id: str, card_mask: str, card_type: str) -> None:
    payment.status = PaymentStatus.PAID
    payment.transaction_id = transaction_id
    payment.card_mask = card_mask
    payment.card_type = card_type
    payment.paid_at = utc_now()
    payment.failure_reason = ""
    payment.order.payment_status = OrderPayment.PAID
    db.flush()


def mark_failed(db: DbSession, payment: Payment, transaction_id: str, reason: str) -> None:
    payment.status = PaymentStatus.FAILED
    payment.transaction_id = transaction_id or payment.transaction_id
    payment.failure_reason = reason[:255]
    # Заказ остаётся ожидающим оплату: клиент может повторить попытку.
    payment.order.payment_status = OrderPayment.PENDING
    db.flush()


def apply_refund(db: DbSession, payment: Payment, amount: Decimal) -> None:
    """Проводит возврат: частичный оставляет заказ оплаченным, полный — нет."""
    payment.refunded_amount = min(payment.amount, payment.refunded_amount + amount)
    full = payment.refunded_amount >= payment.amount
    payment.status = PaymentStatus.REFUNDED if full else PaymentStatus.PARTIALLY_REFUNDED
    payment.order.payment_status = OrderPayment.REFUNDED if full else OrderPayment.PARTIALLY_REFUNDED
    db.flush()

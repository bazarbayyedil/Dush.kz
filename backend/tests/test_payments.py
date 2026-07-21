"""Правила приёма денег: подпись, повтор уведомления, сверка суммы, возвраты."""

import base64
import hashlib
import hmac
import json
from decimal import Decimal

import pytest
from sqlalchemy import select

from app import payments
from app.config import get_settings
from app.database import SessionLocal
from app.models import Order, OrderItem, OrderPayment, Payment, PaymentStatus, Product

SECRET = "test-api-secret"


@pytest.fixture(autouse=True)
def provider_secret():
    settings = get_settings()
    before = settings.tiptop_api_secret
    settings.tiptop_api_secret = SECRET
    yield
    settings.tiptop_api_secret = before


def sign(body: bytes) -> str:
    return base64.b64encode(hmac.new(SECRET.encode(), body, hashlib.sha256).digest()).decode()


def make_order(total: str = "10000"):
    with SessionLocal.begin() as db:
        product = db.scalar(select(Product).where(Product.slug == "tap-1"))
        order = Order(customer_name="Клиент", phone="+77000000000", total=Decimal(total))
        order.items.append(
            OrderItem(
                product_id=product.id, slug=product.slug, sku=product.sku, title=product.title,
                unit_price=Decimal(total), quantity=1, line_total=Decimal(total),
            )
        )
        db.add(order)
        db.flush()
        return order.id


def test_signature_accepts_only_untampered_body():
    body = json.dumps({"TransactionId": 1, "Amount": 10000}).encode()
    assert payments.verify_signature(body, sign(body))
    assert not payments.verify_signature(body + b" ", sign(body))
    assert not payments.verify_signature(body, "подделка")
    assert not payments.verify_signature(body, None)


def test_repeat_notification_is_ignored():
    """Провайдер повторяет уведомление при таймауте — оплата не должна удвоиться."""
    with SessionLocal.begin() as db:
        assert payments.already_processed(db, "pay", "tx-100", {}) is False
    with SessionLocal.begin() as db:
        assert payments.already_processed(db, "pay", "tx-100", {}) is True
    # Другое событие по той же транзакции — самостоятельное, его пропускаем.
    with SessionLocal.begin() as db:
        assert payments.already_processed(db, "refund", "tx-100", {}) is False


def test_payment_amount_comes_from_database():
    order_id = make_order("10000")
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        payment = payments.start_payment(db, order)
        assert payment.amount == Decimal("10000.00")
        assert order.payment_status == OrderPayment.PENDING

    with SessionLocal() as db:
        payment = db.scalar(select(Payment))
        # Уведомление с завышенной суммой не должно приниматься за настоящую оплату.
        assert payments.amount_matches(payment, Decimal("10000.00"))
        assert not payments.amount_matches(payment, Decimal("1.00"))


def test_repeated_start_reuses_pending_payment():
    order_id = make_order()
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        first = payments.start_payment(db, order)
        second = payments.start_payment(db, order)
        assert first.id == second.id
    with SessionLocal() as db:
        assert db.scalar(select(Payment).where(Payment.order_id == order_id)) is not None
        assert len(db.scalars(select(Payment)).all()) == 1


def test_successful_payment_marks_order_paid():
    order_id = make_order()
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        payment = payments.start_payment(db, order)
        payments.mark_paid(db, payment, "tx-1", "4400 01** **** 1234", "Visa")

    with SessionLocal() as db:
        payment = db.scalar(select(Payment))
        assert payment.status == PaymentStatus.PAID
        assert payment.paid_at is not None
        assert db.get(Order, order_id).payment_status == OrderPayment.PAID
        # Полного номера карты у нас нет и быть не должно.
        assert "*" in payment.card_mask


def test_failed_payment_keeps_order_awaiting_payment():
    order_id = make_order()
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        payment = payments.start_payment(db, order)
        payments.mark_failed(db, payment, "tx-2", "Недостаточно средств")

    with SessionLocal() as db:
        assert db.scalar(select(Payment)).status == PaymentStatus.FAILED
        assert db.get(Order, order_id).payment_status == OrderPayment.PENDING


def test_partial_then_full_refund():
    order_id = make_order("10000")
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        payment = payments.start_payment(db, order)
        payments.mark_paid(db, payment, "tx-3", "**** 1234", "Visa")
        payments.apply_refund(db, payment, Decimal("4000"))
        assert payment.status == PaymentStatus.PARTIALLY_REFUNDED
        assert payment.refundable == Decimal("6000")
        assert order.payment_status == OrderPayment.PARTIALLY_REFUNDED

        payments.apply_refund(db, payment, Decimal("6000"))
        assert payment.status == PaymentStatus.REFUNDED
        assert order.payment_status == OrderPayment.REFUNDED


def test_refund_cannot_exceed_paid_amount():
    order_id = make_order("10000")
    with SessionLocal.begin() as db:
        order = db.get(Order, order_id)
        payment = payments.start_payment(db, order)
        payments.mark_paid(db, payment, "tx-4", "**** 1234", "Visa")
        payments.apply_refund(db, payment, Decimal("99999"))
        assert payment.refunded_amount == Decimal("10000")
        assert payment.refundable == Decimal("0")

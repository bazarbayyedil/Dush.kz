"""Уведомление о заявке в Telegram: формат текста и отказоустойчивость."""

import asyncio
from decimal import Decimal

from sqlalchemy import select

from app import telegram
from app.config import get_settings
from app.database import SessionLocal
from app.models import Order, OrderItem, Product


def make_order():
    with SessionLocal.begin() as db:
        product = db.scalar(select(Product).where(Product.slug == "tap-1"))
        order = Order(
            customer_name="Аружан <тест>",
            phone="+77001234567",
            city="Астана",
            comment="Позвонить после 18:00 & уточнить",
            shipping="pickup",
            payment_method="transfer",
            total=Decimal("20000"),
        )
        order.items.append(
            OrderItem(
                product_id=product.id, slug=product.slug, sku=product.sku, title=product.title,
                unit_price=Decimal("10000"), quantity=2, line_total=Decimal("20000"),
            )
        )
        db.add(order)
        db.flush()
        return telegram.build_message(order)


def test_message_has_key_fields_and_escapes_input():
    text = make_order()
    assert "Новая заявка" in text
    assert "+77001234567" in text
    assert "Самовывоз" in text
    assert "Переводом" in text
    assert "20 000 ₸" in text
    # Клиентский ввод экранирован — Telegram не сломается на < > &.
    assert "&lt;тест&gt;" in text
    assert "&amp;" in text
    assert "<тест>" not in text


def test_notify_is_noop_without_config():
    settings = get_settings()
    settings.telegram_bot_token = ""
    settings.telegram_chat_id = ""
    # Не настроен — тихо выходит, без сети и без исключений.
    asyncio.run(telegram.notify_order("любой текст"))


def test_notify_swallows_errors(monkeypatch):
    settings = get_settings()
    settings.telegram_bot_token = "x"
    settings.telegram_chat_id = "1"

    class Boom:
        def __init__(self, *a, **k): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def post(self, *a, **k): raise RuntimeError("сеть недоступна")

    monkeypatch.setattr(telegram.httpx, "AsyncClient", Boom)
    # Сбой сети не должен подниматься наверх — заказ уже сохранён.
    asyncio.run(telegram.notify_order("текст"))
    settings.telegram_bot_token = ""
    settings.telegram_chat_id = ""

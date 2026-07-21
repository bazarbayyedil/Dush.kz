"""Уведомление о новой заявке в Telegram.

Отправка не должна влиять на оформление заказа: любые сбои Telegram
проглатываются, заказ уже сохранён в базу к моменту вызова. Телефон, имя
и комментарий клиента в логи не попадают (см. AGENTS.md).
"""

import html
import logging

import httpx

from .config import get_settings
from .models import Order

log = logging.getLogger("dush.telegram")

SHIPPING = {"delivery": "Доставка", "pickup": "Самовывоз"}
PAYMENT = {"prepaid": "Предоплата", "cash": "При получении", "transfer": "Переводом"}


def _money(value) -> str:
    return f"{round(value):,}".replace(",", " ") + " ₸"


def build_message(order: Order) -> str:
    """HTML-текст заявки для Telegram. Экранируем ввод клиента."""
    e = html.escape
    lines = [
        f"🛒 <b>Новая заявка с сайта</b> · {e(str(order.id)[:8])}",
        "",
        f"👤 {e(order.customer_name)}",
        f"📞 {e(order.phone)}",
    ]
    if order.city:
        lines.append(f"🏙 {e(order.city)}")
    lines.append(
        f"🚚 {SHIPPING.get(order.shipping, order.shipping)} · "
        f"💳 {PAYMENT.get(order.payment_method, order.payment_method)}"
    )
    if order.comment:
        lines.append(f"💬 {e(order.comment)}")
    lines.append("")
    for item in order.items:
        lines.append(f"• {e(item.title)} — {item.quantity} × {_money(item.unit_price)}")
    lines.append("")
    lines.append(f"<b>Итого: {_money(order.total)}</b>")
    return "\n".join(lines)


async def notify_order(text: str) -> None:
    """Шлём готовый текст в Telegram. Молча выходим, если бот не настроен."""
    s = get_settings()
    if not (s.telegram_bot_token and s.telegram_chat_id):
        return
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{s.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": s.telegram_chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
        if response.status_code != 200:
            log.warning("telegram sendMessage вернул %s", response.status_code)
    except Exception:
        # Заказ уже в базе — уведомление некритично, клиента не роняем.
        log.warning("не удалось отправить уведомление в Telegram")

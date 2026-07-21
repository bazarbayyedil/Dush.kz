"""Публикация витрины: панель просит пересборку, служба её выполняет.

Сама панель работает в изоляции (systemd ProtectSystem=strict) и писать может
только в shared. Поэтому запрос — это файл-сигнал, а не запуск сборки напрямую.
"""

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session as DbSession

from .models import AuditLog, Product

SHARED = Path("/var/www/dush.kz/shared")
REQUEST_FILE = SHARED / "publish.request"
STATUS_FILE = SHARED / "publish.status"
LOG_FILE = SHARED / "publish.log"


def read_status() -> dict:
    """Состояние последней публикации: ждём / идёт / готово / ошибка."""
    if REQUEST_FILE.exists():
        return {"state": "queued", "message": "Запрос принят, сборка вот-вот начнётся", "at": ""}
    if not STATUS_FILE.exists():
        return {"state": "idle", "message": "", "at": ""}
    try:
        return json.loads(STATUS_FILE.read_text())
    except (OSError, ValueError):
        return {"state": "unknown", "message": "Не удалось прочитать состояние", "at": ""}


def request_publish(login: str) -> None:
    REQUEST_FILE.write_text(f"{login} {datetime.now().isoformat(timespec='seconds')}\n")


def is_busy() -> bool:
    state = read_status().get("state")
    return state in {"queued", "running"}


def pending_changes(db: DbSession) -> dict:
    """Что накопилось с последней публикации — чтобы кнопка не была вслепую."""
    edited = db.scalar(
        select(func.count()).select_from(Product).where(
            or_(Product.manual_fields.is_not(None), Product.manual_fields != [])
        )
    ) or 0
    # Точный счётчик правок: у части товаров manual_fields пуст.
    products = db.scalars(select(Product.manual_fields).where(Product.manual_fields != [])).all()
    edited = sum(1 for fields in products if fields)

    last_edit = db.scalar(
        select(func.max(AuditLog.created_at)).where(
            AuditLog.entity == "product", AuditLog.action == "update"
        )
    )
    return {
        "edited_products": edited,
        "last_edit_at": last_edit.isoformat() if last_edit else None,
    }


def tail_log(lines: int = 25) -> str:
    if not LOG_FILE.exists():
        return ""
    try:
        return "\n".join(LOG_FILE.read_text(errors="replace").splitlines()[-lines:])
    except OSError:
        return ""

#!/usr/bin/env python3
"""Находит chat_id группы для уведомлений о заявках.

Токен берём из переменной окружения TELEGRAM_BOT_TOKEN (в чат его не вводим).
Порядок:
  1) создать бота у @BotFather, скопировать токен;
  2) создать группу, добавить туда бота и менеджеров;
  3) написать в группе любое сообщение (например «привет»);
  4) запустить:
       TELEGRAM_BOT_TOKEN=<токен> python3 scripts/telegram_setup.py

Скрипт напечатает найденные чаты и их chat_id — его и пропишем в backend.env.
"""

import json
import os
import sys
import urllib.request

token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
if not token:
    print("Задайте TELEGRAM_BOT_TOKEN=<токен> перед запуском", file=sys.stderr)
    raise SystemExit(1)

url = f"https://api.telegram.org/bot{token}/getUpdates"
try:
    with urllib.request.urlopen(url, timeout=15) as response:
        data = json.load(response)
except Exception as exc:  # noqa: BLE001 - показываем причину пользователю
    print(f"Не удалось обратиться к Telegram: {exc}", file=sys.stderr)
    raise SystemExit(1) from exc

if not data.get("ok"):
    print(f"Telegram вернул ошибку: {data}", file=sys.stderr)
    raise SystemExit(1)

seen: dict[str, str] = {}
for update in data.get("result", []):
    chat = (update.get("message") or update.get("channel_post") or {}).get("chat")
    if chat:
        title = chat.get("title") or chat.get("username") or chat.get("first_name") or "—"
        seen[str(chat["id"])] = f'{chat.get("type")}: {title}'

if not seen:
    print("Обновлений нет. Напишите в группе любое сообщение и запустите снова.")
    print("(Бот видит только сообщения, отправленные ПОСЛЕ его добавления.)")
    raise SystemExit(0)

print("Найдены чаты:")
for chat_id, label in seen.items():
    print(f"  chat_id = {chat_id}   ({label})")
print("\nНужный — с типом group/supergroup. Впишите его в TELEGRAM_CHAT_ID.")

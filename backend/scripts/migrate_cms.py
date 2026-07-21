#!/usr/bin/env python3
"""Досоздаёт то, что create_all() не умеет: колонки и значения enum.

Скрипт идемпотентный — повторный запуск ничего не ломает. Запускается при
каждом релизе до импорта каталога.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import inspect, text  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.models import OrderStatus  # noqa: E402

# Колонки, добавленные к таблице orders вместе с панелью управления.
ORDER_COLUMNS = {
    "source": "VARCHAR(120) NOT NULL DEFAULT ''",
    "manager_id": "INTEGER REFERENCES users(id)",
    "manager_note": "TEXT NOT NULL DEFAULT ''",
    "closing_reason": "VARCHAR(120) NOT NULL DEFAULT ''",
    "updated_at": "TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "payment_status": "VARCHAR(24) NOT NULL DEFAULT 'unpaid'",
    "shipping": "VARCHAR(24) NOT NULL DEFAULT 'delivery'",
    "payment_method": "VARCHAR(24) NOT NULL DEFAULT 'cash'",
}

PRODUCT_COLUMNS = {
    "manual_fields": "JSONB NOT NULL DEFAULT '[]'::jsonb",
}


def sync_order_status(connection) -> None:
    """Приводит тип order_status к набору статусов из модели.

    SQLAlchemy хранит имена членов перечисления (NEW), а не значения (new).
    Лишние значения из enum нельзя удалить по одному, поэтому тип пересоздаётся
    целиком — при этом старые данные приводятся к верхнему регистру.
    """
    expected = [status.name for status in OrderStatus]
    actual = [
        row[0] for row in connection.execute(text("SELECT unnest(enum_range(NULL::order_status))::text"))
    ]
    if actual == expected:
        return

    values = ", ".join(f"'{name}'" for name in expected)
    connection.execute(text(f"CREATE TYPE order_status_new AS ENUM ({values})"))
    connection.execute(text("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT"))
    connection.execute(
        text(
            "ALTER TABLE orders ALTER COLUMN status TYPE order_status_new "
            "USING upper(status::text)::order_status_new"
        )
    )
    connection.execute(text("DROP TYPE order_status"))
    connection.execute(text("ALTER TYPE order_status_new RENAME TO order_status"))
    print(f"статусы заказа приведены к модели: {', '.join(expected)}")


def backfill_manual_fields(connection) -> None:
    """Восстанавливает отметки о ручных правках по журналу действий.

    Товары, отредактированные до появления manual_fields, иначе потеряли бы
    изменения при первом же импорте каталога.
    """
    rows = connection.execute(
        text(
            "SELECT entity_id, jsonb_object_keys(changes::jsonb) AS field FROM audit_log "
            "WHERE entity = 'product' AND action = 'update'"
        )
    ).all()
    by_product: dict[str, set[str]] = {}
    for entity_id, field in rows:
        by_product.setdefault(entity_id, set()).add(field)

    restored = 0
    for entity_id, fields in by_product.items():
        result = connection.execute(
            text(
                "UPDATE products SET manual_fields = :fields "
                "WHERE id = :pid AND manual_fields = '[]'::jsonb"
            ),
            {"fields": json.dumps(sorted(fields)), "pid": int(entity_id)},
        )
        restored += result.rowcount or 0
    if restored:
        print(f"отмечено как правленное вручную: товаров {restored}")


def main() -> int:
    is_postgres = engine.dialect.name == "postgresql"
    Base.metadata.create_all(engine)

    inspector = inspect(engine)
    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    product_columns = {column["name"] for column in inspector.get_columns("products")}

    with engine.connect() as connection:
        connection = connection.execution_options(isolation_level="AUTOCOMMIT")

        if is_postgres:
            sync_order_status(connection)

        for table, columns, existing in (
            ("orders", ORDER_COLUMNS, order_columns),
            ("products", PRODUCT_COLUMNS, product_columns),
        ):
            for name, definition in columns.items():
                if name in existing:
                    continue
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
                print(f"колонка добавлена: {table}.{name}")

        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at)")
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_orders_manager_id ON orders (manager_id)")
        )

        if is_postgres:
            backfill_manual_fields(connection)

    print("схема актуальна")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

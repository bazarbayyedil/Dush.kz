"""Права доступа панели управления.

Право — строка вида `<раздел>.<действие>`. Роль хранит плоский список прав,
поэтому администратор может собрать свою роль без участия разработчика.
"""

from typing import Final

# Каталог разбит по полям: специалист по заявкам видит товар, но не трогает
# фото, описание и цену — это отдельные права, а не один «доступ к каталогу».
CATALOG_VIEW: Final = "catalog.view"
CATALOG_CONTENT: Final = "catalog.content"
CATALOG_PRICE: Final = "catalog.price"
CATALOG_STOCK: Final = "catalog.stock"
CATALOG_CREATE: Final = "catalog.create"

ORDERS_VIEW: Final = "orders.view"
ORDERS_STATUS: Final = "orders.status"
ORDERS_EDIT: Final = "orders.edit"
# Возврат денег клиенту — отдельное право: это движение средств, а не смена статуса.
ORDERS_REFUND: Final = "orders.refund"

CUSTOMERS_VIEW: Final = "customers.view"
# Публикация витрины: выкладывает правки каталога на живой сайт.
PUBLISH: Final = "catalog.publish"
ANALYTICS_VIEW: Final = "analytics.view"
AUDIT_VIEW: Final = "audit.view"
USERS_MANAGE: Final = "users.manage"
SETTINGS_MANAGE: Final = "settings.manage"

# Порядок задаёт вид списка в настройках роли.
ALL_PERMISSIONS: Final[dict[str, str]] = {
    CATALOG_VIEW: "Каталог — просмотр",
    CATALOG_CONTENT: "Каталог — фото и описания",
    CATALOG_PRICE: "Каталог — цены",
    CATALOG_STOCK: "Каталог — остатки и наличие",
    CATALOG_CREATE: "Каталог — создание и удаление товаров",
    PUBLISH: "Каталог — публикация на сайт",
    ORDERS_VIEW: "Заказы — просмотр",
    ORDERS_STATUS: "Заказы — обработка и статусы",
    ORDERS_EDIT: "Заказы — состав и сумма",
    ORDERS_REFUND: "Заказы — возврат денег клиенту",
    CUSTOMERS_VIEW: "Клиенты — просмотр",
    ANALYTICS_VIEW: "Аналитика и отчёты",
    AUDIT_VIEW: "Журнал действий",
    USERS_MANAGE: "Пользователи и роли",
    SETTINGS_MANAGE: "Системные настройки",
}

# Роли «из коробки» по матрице из ТЗ. Права роли редактируются в панели,
# поэтому набор ниже — стартовая точка, а не жёсткое ограничение.
DEFAULT_ROLES: Final[dict[str, dict]] = {
    "owner": {
        "title": "Владелец",
        "permissions": list(ALL_PERMISSIONS),
        "system": True,
    },
    "admin": {
        "title": "Администратор",
        "permissions": [
            CATALOG_VIEW, CATALOG_CONTENT, CATALOG_PRICE, CATALOG_STOCK, CATALOG_CREATE, PUBLISH,
            ORDERS_VIEW, ORDERS_STATUS, ORDERS_EDIT, ORDERS_REFUND,
            CUSTOMERS_VIEW, ANALYTICS_VIEW, AUDIT_VIEW,
        ],
        "system": False,
    },
    "marketer": {
        "title": "Маркетолог",
        "permissions": [
            CATALOG_VIEW, CATALOG_CONTENT, CATALOG_STOCK, CATALOG_CREATE, PUBLISH,
            ORDERS_VIEW, CUSTOMERS_VIEW, ANALYTICS_VIEW,
        ],
        "system": False,
    },
    "manager": {
        "title": "Специалист по заявкам",
        "permissions": [CATALOG_VIEW, ORDERS_VIEW, ORDERS_STATUS, ORDERS_EDIT, CUSTOMERS_VIEW],
        "system": False,
    },
    "analyst": {
        "title": "Аналитик",
        "permissions": [CATALOG_VIEW, ORDERS_VIEW, CUSTOMERS_VIEW, ANALYTICS_VIEW],
        "system": False,
    },
}

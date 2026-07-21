"""Приёмка ролевой модели: права проверяются на API, а не только в интерфейсе."""

import pytest
from sqlalchemy import select

from app.database import SessionLocal
from app.models import Order, OrderItem, Product, Role, User
from app.permissions import DEFAULT_ROLES
from app.security import hash_password

PASSWORD = "test-password-123"


@pytest.fixture
def staff():
    """Создаёт по сотруднику на каждую роль из коробки."""
    with SessionLocal.begin() as db:
        for slug, spec in DEFAULT_ROLES.items():
            role = Role(slug=slug, title=spec["title"], permissions=spec["permissions"], system=spec["system"])
            db.add(role)
            db.flush()
            db.add(
                User(
                    login=slug,
                    name=spec["title"],
                    password_hash=hash_password(PASSWORD),
                    role_id=role.id,
                )
            )


def sign_in(client, login: str):
    response = client.post("/api/v1/admin/login", json={"login": login, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return response


def product_id() -> int:
    with SessionLocal() as db:
        return db.scalar(select(Product.id).where(Product.slug == "tap-1"))


def make_order() -> str:
    with SessionLocal.begin() as db:
        product = db.scalar(select(Product).where(Product.slug == "tap-1"))
        order = Order(customer_name="Клиент", phone="+77000000000", city="Астана", total=10000)
        order.items.append(
            OrderItem(
                product_id=product.id, slug=product.slug, sku=product.sku, title=product.title,
                unit_price=10000, quantity=1, line_total=10000,
            )
        )
        db.add(order)
        db.flush()
        return str(order.id)


def test_anonymous_cannot_reach_admin(client):
    assert client.get("/api/v1/admin/products").status_code == 401
    assert client.get("/api/v1/admin/orders").status_code == 401
    assert client.patch("/api/v1/admin/products/1", json={"price": 1}).status_code == 401


def test_wrong_password_is_rejected(client, staff):
    response = client.post("/api/v1/admin/login", json={"login": "owner", "password": "неверный"})
    assert response.status_code == 401


def test_manager_cannot_edit_photos_or_description(client, staff):
    """Ключевой пункт ТЗ: специалист по заявкам не редактирует контент."""
    sign_in(client, "manager")
    pid = product_id()

    assert client.get(f"/api/v1/admin/products/{pid}").status_code == 200
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"images": ["/products/x/1.jpeg"]}).status_code == 403
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"description": "текст"}).status_code == 403
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"title": "Новое имя"}).status_code == 403
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"price": 1}).status_code == 403

    with SessionLocal() as db:
        product = db.get(Product, pid)
        assert product.title == "Test Tap"
        assert product.images == []


def test_manager_works_with_orders(client, staff):
    sign_in(client, "manager")
    order_id = make_order()

    assert client.get("/api/v1/admin/orders").status_code == 200
    moved = client.patch(f"/api/v1/admin/orders/{order_id}/status", json={"status": "confirmed"})
    assert moved.status_code == 200
    assert moved.json()["status"] == "confirmed"


def test_marketer_edits_content_but_not_price(client, staff):
    sign_in(client, "marketer")
    pid = product_id()

    ok = client.patch(f"/api/v1/admin/products/{pid}", json={"description": "Новое описание"})
    assert ok.status_code == 200
    assert ok.json()["description"] == "Новое описание"
    # Право на цену — отдельный переключатель, по умолчанию у маркетолога его нет.
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"price": 5}).status_code == 403


def test_analyst_is_read_only(client, staff):
    sign_in(client, "analyst")
    pid = product_id()
    order_id = make_order()

    assert client.get("/api/v1/admin/products").status_code == 200
    assert client.get("/api/v1/admin/stats").status_code == 200
    assert client.patch(f"/api/v1/admin/products/{pid}", json={"in_stock": False}).status_code == 403
    assert client.patch(f"/api/v1/admin/orders/{order_id}/status", json={"status": "confirmed"}).status_code == 403


def test_only_owner_manages_users(client, staff):
    sign_in(client, "admin")
    assert client.get("/api/v1/admin/users").status_code == 403
    client.post("/api/v1/admin/logout")

    sign_in(client, "owner")
    assert client.get("/api/v1/admin/users").status_code == 200


def test_cancel_requires_reason(client, staff):
    sign_in(client, "manager")
    order_id = make_order()

    assert client.patch(f"/api/v1/admin/orders/{order_id}/status", json={"status": "cancelled"}).status_code == 422
    ok = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        json={"status": "cancelled", "reason": "Нет в наличии"},
    )
    assert ok.status_code == 200
    assert ok.json()["closing_reason"] == "Нет в наличии"


def test_changes_are_written_to_audit_log(client, staff):
    sign_in(client, "owner")
    pid = product_id()
    client.patch(f"/api/v1/admin/products/{pid}", json={"price": 12345})

    entries = client.get("/api/v1/admin/audit").json()
    assert entries[0]["user_login"] == "owner"
    assert entries[0]["entity"] == "product"
    assert entries[0]["changes"]["price"]["to"] == "12345"


def test_blocked_user_loses_session_immediately(client, staff):
    sign_in(client, "owner")
    with SessionLocal() as db:
        manager_id = db.scalar(select(User.id).where(User.login == "manager"))

    manager_client = client.__class__(client.app)
    sign_in(manager_client, "manager")
    assert manager_client.get("/api/v1/admin/orders").status_code == 200

    assert client.patch(f"/api/v1/admin/users/{manager_id}", json={"active": False}).status_code == 200
    assert manager_client.get("/api/v1/admin/orders").status_code == 401


def test_order_total_recalculated_from_database(client, staff):
    sign_in(client, "manager")
    order_id = make_order()

    response = client.put(
        f"/api/v1/admin/orders/{order_id}/items",
        json={"items": [{"slug": "tap-1", "quantity": 3}]},
    )
    assert response.status_code == 200
    assert response.json()["total"] == "30000.00"

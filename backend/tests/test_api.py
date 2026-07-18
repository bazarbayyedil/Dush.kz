def test_catalog_is_paginated(client):
    response = client.get("/api/v1/products?page_size=1")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["slug"] == "tap-1"


def test_order_uses_database_price(client):
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_name": "Aruzhan",
            "phone": "+7 700 000 00 00",
            "city": "Astana",
            "items": [{"slug": "tap-1", "quantity": 2}],
        },
    )
    assert response.status_code == 201
    assert response.json()["total"] == "20000.00"


def test_order_rejects_unknown_product(client):
    response = client.post(
        "/api/v1/orders",
        json={"customer_name": "A", "phone": "77000000000", "items": [{"slug": "missing", "quantity": 1}]},
    )
    assert response.status_code == 422


def test_admin_orders_require_token(client):
    assert client.get("/api/v1/admin/orders").status_code == 401
    assert client.get("/api/v1/admin/orders", headers={"Authorization": "Bearer test-admin-token"}).status_code == 200


def test_admin_login_uses_http_only_cookie(client):
    assert client.post("/api/v1/admin/login", json={"password": "wrong"}).status_code == 401

    response = client.post("/api/v1/admin/login", json={"password": "test-admin-token"})

    assert response.status_code == 200
    assert response.json() == {"authenticated": True}
    assert "HttpOnly" in response.headers["set-cookie"]
    assert client.get("/api/v1/admin/session").status_code == 200

    client.cookies.set("dush_admin_session", "1.invalid")
    assert client.get("/api/v1/admin/session").status_code == 401


def test_admin_can_manage_orders(client):
    client.post("/api/v1/admin/login", json={"password": "test-admin-token"})
    created = client.post(
        "/api/v1/orders",
        json={"customer_name": "Aruzhan", "phone": "77000000000", "items": [{"slug": "tap-1", "quantity": 1}]},
    ).json()

    summary = client.get("/api/v1/admin/summary")
    orders = client.get("/api/v1/admin/orders")
    updated = client.patch(f"/api/v1/admin/orders/{created['id']}", json={"status": "confirmed"})

    assert summary.status_code == 200
    assert summary.json()["orders_new"] == 1
    assert orders.json()[0]["items"][0]["title"] == "Test Tap"
    assert updated.status_code == 200
    assert updated.json()["status"] == "confirmed"


def test_admin_can_search_and_update_products(client):
    client.post("/api/v1/admin/login", json={"password": "test-admin-token"})

    products = client.get("/api/v1/admin/products?q=SKU-1")
    updated = client.patch(
        "/api/v1/admin/products/tap-1",
        json={"price": "12500.00", "in_stock": False, "active": False},
    )

    assert products.status_code == 200
    assert products.json()["total"] == 1
    assert updated.status_code == 200
    assert updated.json()["price"] == "12500.00"
    assert updated.json()["in_stock"] is False
    assert updated.json()["active"] is False

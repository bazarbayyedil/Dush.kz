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

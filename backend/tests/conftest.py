import os

os.environ["DATABASE_URL"] = "sqlite:////tmp/dush-backend-test.db"
os.environ["ADMIN_TOKEN"] = "test-admin-token"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import Product


@pytest.fixture(autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal.begin() as db:
        db.add(
            Product(
                slug="tap-1",
                sku="SKU-1",
                title="Test Tap",
                brand="Dush",
                category="taps",
                category_title="Taps",
                price=10000,
                in_stock=True,
                on_sale=False,
                images=[],
                attrs={},
                description="",
            )
        )
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    return TestClient(app)

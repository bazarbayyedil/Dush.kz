import pytest

from app.media import normalize_image_url


def test_local_product_image_is_mapped_to_media_url():
    assert normalize_image_url("/products/tap-1/front.webp", "/media") == "/media/products/tap-1/front.webp"


def test_external_cdn_url_is_preserved():
    url = "https://cdn.example.kz/products/tap-1/front.webp"
    assert normalize_image_url(url, "/media") == url


@pytest.mark.parametrize(
    "value",
    [
        "data:image/png;base64,AAAA",
        "file:///tmp/front.webp",
        "/products/../secret",
        "/products/%2e%2e/secret",
        "/products/tap-1\\front.webp",
        "/not-products/front.webp",
    ],
)
def test_binary_or_unsafe_image_values_are_rejected(value):
    with pytest.raises(ValueError):
        normalize_image_url(value, "/media")

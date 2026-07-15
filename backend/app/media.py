from urllib.parse import unquote, urlsplit


def normalize_image_url(value: str, media_base_url: str) -> str:
    """Convert generated /products paths to public URLs without storing file data."""
    value = value.strip()
    if not value:
        return ""
    parsed = urlsplit(value)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return value
    if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError(f"unsupported image URL: {value}")
    path = unquote(parsed.path)
    if not path.startswith("/products/"):
        raise ValueError(f"local image URL must start with /products/: {value}")
    if "\\" in path or any(part in {"", ".", ".."} for part in path.removeprefix("/").split("/")):
        raise ValueError(f"unsafe image URL: {value}")
    return f"{media_base_url.rstrip('/')}{path}"

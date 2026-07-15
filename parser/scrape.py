#!/usr/bin/env python3
"""fontanero.kz scraper -> JSON + downloaded images.

Usage:
  python3 scrape.py --list-categories
  python3 scrape.py --category smesiteli-dlya-kukhni --limit 20
  python3 scrape.py --all
"""
from __future__ import annotations
import argparse, json, os, re, sys, time, hashlib
from pathlib import Path
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

BASE = "https://fontanero.kz"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
HEADERS = {"User-Agent": UA, "Accept-Language": "ru,en;q=0.9"}
SLEEP = 0.25

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "data"
IMG_DIR = ROOT / "images"
DATA_DIR.mkdir(exist_ok=True)
IMG_DIR.mkdir(exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def get(url: str, retries: int = 5) -> str:
    """GET с повторами при сетевых сбоях (DNS/таймаут/разрыв)."""
    last = None
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=30)
            r.raise_for_status()
            return r.text
        except requests.exceptions.RequestException as e:
            last = e
            wait = min(2 ** attempt, 30)
            print(f"    retry {attempt + 1}/{retries} через {wait}s: {url}", file=sys.stderr, flush=True)
            time.sleep(wait)
    raise last


def slugify(name: str) -> str:
    """Filesystem/URL-safe folder name from an SKU or slug."""
    s = re.sub(r"[^\w\-]+", "-", name.strip(), flags=re.UNICODE).strip("-")
    return re.sub(r"-+", "-", s).lower() or "item"


def sanitize(text: str) -> str:
    """Remove fontanero brand mentions from text."""
    if not text:
        return text
    patterns = [
        r"fontanero\.kz",
        r"fontanero",
        r"фонтанеро",
        r"Фонтанеро",
        r"ФОНТАНЕРО",
    ]
    for p in patterns:
        text = re.sub(p, "", text, flags=re.IGNORECASE)
    return re.sub(r"\s{2,}", " ", text).strip()


def list_home_categories() -> list[dict]:
    """Extract full category tree from home page."""
    html = get(BASE + "/")
    soup = BeautifulSoup(html, "html.parser")
    cats = []
    seen = set()
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if h.startswith("/category/") or h.startswith("/categories/"):
            if h in seen:
                continue
            seen.add(h)
            slug = h.rsplit("/", 1)[-1].split("?")[0]
            cats.append({"url": h, "slug": slug, "title": a.get_text(strip=True) or slug})
    return cats


def scrape_category_page(url: str) -> tuple[list[str], bool]:
    """Return (product_urls_on_page, has_next_page)."""
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")
    urls = []
    for card in soup.select(".catalog__item"):
        a = card.find("a", href=True)
        if a and a["href"].startswith("/products/"):
            urls.append(urljoin(BASE, a["href"]))

    # detect pagination — current page vs next
    current = None
    max_page = 1
    for link in soup.select(".pagination a, [class*='pagin'] a"):
        txt = link.get_text(strip=True)
        if txt.isdigit():
            max_page = max(max_page, int(txt))
    # from URL params find current
    parsed = urlparse(url)
    from urllib.parse import parse_qs
    q = parse_qs(parsed.query)
    current = int(q.get("page", ["1"])[0])
    return urls, current < max_page


def crawl_category(category_url: str, limit: int | None = None) -> list[str]:
    """Walk all pages of a category, return all product URLs."""
    if not category_url.startswith("http"):
        category_url = urljoin(BASE, category_url)
    all_urls = []
    page = 1
    while True:
        page_url = f"{category_url}?page={page}" if page > 1 else category_url
        try:
            urls, has_next = scrape_category_page(page_url)
        except Exception as e:
            print(f"    ! page {page} error: {e}", file=sys.stderr)
            break
        if not urls:
            break
        all_urls.extend(urls)
        print(f"    page {page}: +{len(urls)} products (total {len(all_urls)})")
        if limit and len(all_urls) >= limit:
            return all_urls[:limit]
        if not has_next:
            break
        page += 1
        time.sleep(SLEEP)
    return all_urls


def parse_price(text: str) -> int | None:
    if not text:
        return None
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def scrape_product(url: str) -> dict | None:
    """Extract one product's data from its page."""
    try:
        html = get(url)
    except Exception as e:
        print(f"  ! {url}: {e}", file=sys.stderr)
        return None

    soup = BeautifulSoup(html, "html.parser")
    info = soup.select_one(".product__info")
    if not info:
        return None

    # Title
    title_el = info.select_one("h1.product__info-title")
    title = sanitize(title_el.get_text(strip=True)) if title_el else ""

    # Attributes from product__list
    attrs = {}
    sku = None
    brand = None
    for li in info.select(".product__list-item"):
        name_el = li.select_one(".name")
        val_el = li.select_one(".value") or li
        if name_el:
            name = name_el.get_text(strip=True).rstrip(":").strip()
            # value = whole li text minus name
            full = li.get_text(" ", strip=True)
            value = full.replace(name_el.get_text(strip=True), "", 1).strip(" :")
        else:
            parts = li.get_text(":", strip=True).split(":", 1)
            if len(parts) != 2:
                continue
            name, value = parts[0].strip(), parts[1].strip()
        value = sanitize(value)
        if not value:
            continue
        attrs[name] = value
        if name.lower().startswith("артикул"):
            sku = value
        elif name.lower().startswith("производитель") or name.lower().startswith("бренд"):
            brand = value

    # Price
    price_block = info.select_one(".product__info-price")
    price = None
    old_price = None
    if price_block:
        # current price in <span>
        span = price_block.find("span")
        if span:
            price = parse_price(span.get_text())
        # old price in first line-through div
        for div in price_block.find_all("div"):
            style = div.get("style", "")
            if "line-through" in style:
                old_price = parse_price(div.get_text())
                break
        # fallback
        if price is None:
            price = parse_price(price_block.get_text())

    # Availability tags
    in_stock = bool(soup.select_one(".product__slider-tag.green"))
    on_sale = bool(soup.select_one(".product__slider-tag.red"))

    # Images — dedupe preserving order
    imgs = []
    seen = set()
    for img in soup.select(".product__slider img"):
        src = img.get("src") or img.get("data-src")
        if src and src.startswith("/img/") and src not in seen:
            seen.add(src)
            imgs.append(urljoin(BASE, src))

    # Description
    desc_el = soup.select_one(".product__description, .product__info-description, .description")
    desc_html = ""
    desc_text = ""
    if desc_el:
        desc_text = sanitize(desc_el.get_text("\n", strip=True))
        # Sanitize any anchors/links back to fontanero
        for a in desc_el.find_all("a", href=True):
            a["href"] = "#"
        desc_html = sanitize(str(desc_el))

    slug = url.rsplit("/", 1)[-1]

    return {
        "slug": slug,
        "url": url,
        "sku": sku,
        "title": title,
        "brand": brand,
        "price": price,
        "old_price": old_price,
        "in_stock": in_stock,
        "on_sale": on_sale,
        "images": imgs,
        "attrs": attrs,
        "description_text": desc_text,
        "description_html": desc_html,
    }


def download_image(url: str, sku_dir: Path, idx: int, retries: int = 4) -> str | None:
    """Download an image to sku_dir/{idx}.{ext}. Returns local relative path."""
    ext = os.path.splitext(urlparse(url).path)[1] or ".jpg"
    if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    out = sku_dir / f"{idx}{ext}"
    # уже скачано ранее — пропускаем
    if out.exists() and out.stat().st_size > 0:
        return str(out.relative_to(ROOT))
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=30, stream=True)
            r.raise_for_status()
            with open(out, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            return str(out.relative_to(ROOT))
        except requests.exceptions.RequestException as e:
            wait = min(2 ** attempt, 20)
            print(f"    img retry {attempt + 1}/{retries} через {wait}s: {url}", file=sys.stderr, flush=True)
            time.sleep(wait)
    print(f"    img fail {url}", file=sys.stderr, flush=True)
    return None


def scrape_and_save(category_slug: str, limit: int | None = None, download_images: bool = True) -> Path:
    """Scrape one category fully, save JSON + images."""
    cats = list_home_categories()
    # Find category URL by slug
    match = next((c for c in cats if c["slug"] == category_slug), None)
    if not match:
        # Try both /category/ and /categories/
        cat_url = f"/categories/{category_slug}"
    else:
        cat_url = match["url"]

    print(f"→ Crawling {cat_url}")
    urls = crawl_category(cat_url, limit=limit)
    print(f"→ Found {len(urls)} product URLs")

    products = []
    for i, url in enumerate(urls, 1):
        print(f"  [{i}/{len(urls)}] {url.rsplit('/',1)[-1][:60]}")
        p = scrape_product(url)
        if not p:
            continue
        # Download images into a filesystem-safe folder.
        # Ключуем по УНИКАЛЬНОМУ slug, а не по sku: артикул бывает "-" или
        # общий у вариантов цвета/размера — это ломало папки (коллизии фото).
        folder = slugify(p["slug"])
        p["img_folder"] = folder
        if download_images and p["images"]:
            sku_dir = IMG_DIR / folder
            sku_dir.mkdir(parents=True, exist_ok=True)
            local_imgs = []
            for j, img_url in enumerate(p["images"], 1):
                local = download_image(img_url, sku_dir, j)
                if local:
                    local_imgs.append(local)
            p["local_images"] = local_imgs
        products.append(p)
        time.sleep(SLEEP)

    out_path = DATA_DIR / f"{category_slug}.json"
    out_path.write_text(json.dumps(products, ensure_ascii=False, indent=2))
    print(f"→ Saved {len(products)} products to {out_path}")
    return out_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list-categories", action="store_true")
    ap.add_argument("--category", help="category slug (e.g. smesiteli-dlya-kukhni)")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--no-images", action="store_true")
    ap.add_argument("--all", action="store_true", help="scrape every leaf category")
    ap.add_argument("--force", action="store_true", help="re-scrape even if JSON exists")
    args = ap.parse_args()

    if args.list_categories:
        cats = list_home_categories()
        for c in cats:
            print(f"{c['slug']:60} {c['title']}")
        return

    if args.all:
        cats = list_home_categories()
        # /category/ (singular) are leaf subcategories
        leaves = [c for c in cats if c["url"].startswith("/category/")]
        print(f"Scraping {len(leaves)} leaf categories", flush=True)
        for i, c in enumerate(leaves, 1):
            out = DATA_DIR / f"{c['slug']}.json"
            # resume: пропускаем уже сохранённые непустые категории
            if not args.force and out.exists() and out.stat().st_size > 5:
                print(f"[{i}/{len(leaves)}] skip (done): {c['slug']}", flush=True)
                continue
            print(f"[{i}/{len(leaves)}] === {c['slug']} ===", flush=True)
            try:
                scrape_and_save(c["slug"], download_images=not args.no_images)
            except Exception as e:
                print(f"! category {c['slug']} failed: {e}", file=sys.stderr, flush=True)
        return

    if args.category:
        scrape_and_save(args.category, limit=args.limit, download_images=not args.no_images)
        return

    ap.print_help()


if __name__ == "__main__":
    main()

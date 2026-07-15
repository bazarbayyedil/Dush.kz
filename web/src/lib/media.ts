const PRODUCT_MEDIA_BASE_URL = (
  process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL ?? "/media"
).replace(/\/$/, "");

export function productImageUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/media/")) return value;
  if (value.startsWith("/products/")) return `${PRODUCT_MEDIA_BASE_URL}${value}`;
  return value;
}

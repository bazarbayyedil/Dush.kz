"use client";
import { useEffect, useState } from "react";
import { ExternalLink, GripVertical, Trash2, X } from "lucide-react";
import { api, PERM, type ProductDetail } from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { productImageUrl } from "@/lib/media";
import { ErrorNote, Field, inputClass } from "./ui";

type Patch = Partial<{
  title: string;
  description: string;
  images: string[];
  brand: string;
  price: string;
  old_price: string | null;
  in_stock: boolean;
  on_sale: boolean;
  active: boolean;
}>;

export function ProductEditor({
  productId,
  onClose,
  onSaved,
}: {
  productId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const can = useCan();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [draft, setDraft] = useState<Patch>({});
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canContent = can(PERM.catalogContent);
  const canPrice = can(PERM.catalogPrice);
  const canStock = can(PERM.catalogStock);
  const canPublish = can(PERM.catalogCreate);
  const readOnly = !canContent && !canPrice && !canStock && !canPublish;

  useEffect(() => {
    api
      .get<ProductDetail>(`/products/${productId}`)
      .then((p) => {
        setProduct(p);
        setImages(p.images);
      })
      .catch((e) => setError(e.message));
  }, [productId]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof Patch>(key: K, value: Patch[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const value = <K extends keyof Patch>(key: K): Patch[K] =>
    (draft[key] !== undefined ? draft[key] : (product?.[key as keyof ProductDetail] as Patch[K]));

  const save = async () => {
    if (!product) return;
    const payload: Record<string, unknown> = { ...draft };
    if (images.join("|") !== product.images.join("|")) payload.images = images;
    if (Object.keys(payload).length === 0) return onClose();

    setSaving(true);
    setError("");
    try {
      await api.patch<ProductDetail>(`/products/${product.id}`, payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-card w-full max-w-3xl rounded-2xl my-4">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl">
          <h2 className="font-semibold flex-1 line-clamp-1">{product?.title ?? "Товар"}</h2>
          {product && (
            <a
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener"
              className="text-muted-foreground hover:text-foreground"
              title="Открыть на сайте"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Закрыть">
            <X size={18} />
          </button>
        </header>

        <div className="p-5 space-y-5">
          <ErrorNote error={error} />
          {!product ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Загрузка…</div>
          ) : (
            <>
              {readOnly && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2.5">
                  У вашей роли доступ к карточке только для просмотра.
                </p>
              )}

              <Field label="Название">
                <input
                  className={inputClass}
                  disabled={!canContent}
                  value={(value("title") as string) ?? ""}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Бренд">
                  <input
                    className={inputClass}
                    disabled={!canContent}
                    value={(value("brand") as string) ?? ""}
                    onChange={(e) => set("brand", e.target.value)}
                  />
                </Field>
                <Field label="Артикул">
                  <input className={inputClass} disabled value={product.sku || "—"} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Цена, ₸">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    disabled={!canPrice}
                    value={(value("price") as string) ?? ""}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </Field>
                <Field label="Старая цена, ₸ (для скидки)">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    disabled={!canPrice}
                    value={(value("old_price") as string) ?? ""}
                    onChange={(e) => set("old_price", e.target.value || null)}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-5">
                <Toggle
                  label="В наличии"
                  disabled={!canStock}
                  checked={!!value("in_stock")}
                  onChange={(v) => set("in_stock", v)}
                />
                <Toggle
                  label="Показывать как акцию"
                  disabled={!canPrice}
                  checked={!!value("on_sale")}
                  onChange={(v) => set("on_sale", v)}
                />
                <Toggle
                  label="Опубликован"
                  disabled={!canPublish}
                  checked={!!value("active")}
                  onChange={(v) => set("active", v)}
                />
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  Фото ({images.length}) — первое показывается в каталоге
                </div>
                {images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Фото нет.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {images.map((src, index) => (
                      <div key={src} className="relative group">
                        <div className="aspect-square rounded-lg border border-border overflow-hidden bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productImageUrl(src)} alt="" className="w-full h-full object-contain" />
                        </div>
                        {index === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px]">
                            обложка
                          </span>
                        )}
                        {canContent && (
                          <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <button
                                onClick={() => setImages(move(images, index, index - 1))}
                                className="p-1 rounded bg-white/90 border border-border"
                                title="Сделать раньше"
                              >
                                <GripVertical size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => setImages(images.filter((_, i) => i !== index))}
                              className="p-1 rounded bg-white/90 border border-border text-danger ml-auto"
                              title="Убрать фото"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {canContent && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Здесь можно менять порядок и убирать лишние. Новые файлы пока добавляются
                    синхронизацией каталога.
                  </p>
                )}
              </div>

              <Field label="Описание">
                <textarea
                  rows={7}
                  className={`${inputClass} resize-y`}
                  disabled={!canContent}
                  value={(value("description") as string) ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>

        <footer className="px-5 py-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm">
            Отмена
          </button>
          <button
            onClick={save}
            disabled={saving || readOnly}
            className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function move(list: string[], from: number, to: number): string[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

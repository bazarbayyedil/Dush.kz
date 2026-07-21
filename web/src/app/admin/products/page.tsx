"use client";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api, PERM, type ProductRow } from "@/lib/admin/api";
import { useCan } from "@/lib/admin/session";
import { productImageUrl } from "@/lib/media";
import { Card, Empty, ErrorNote, Money, PageTitle, inputClass } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PublishBar } from "@/components/admin/PublishBar";

type Page = { items: ProductRow[]; total: number; page: number; page_size: number };

export default function ProductsPage() {
  const can = useCan();
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [onlyOut, setOnlyOut] = useState(false);
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "50" });
    if (term) params.set("q", term);
    if (onlyOut) params.set("only_out_of_stock", "true");
    if (onlyHidden) params.set("only_inactive", "true");
    api
      .get<Page>(`/products?${params}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [page, term, onlyOut, onlyHidden]);

  useEffect(() => {
    if (can(PERM.catalogView)) load();
  }, [load, can]);

  useEffect(() => {
    const id = setTimeout(() => {
      setTerm(query.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  if (!can(PERM.catalogView)) {
    return (
      <>
        <PageTitle title="Каталог" />
        <Empty>У вашей роли нет доступа к каталогу.</Empty>
      </>
    );
  }

  const pages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <>
      <PageTitle
        title="Каталог"
        note={data ? `${data.total.toLocaleString("ru-KZ")} товаров` : undefined}
      />
      <ErrorNote error={error} />
      <PublishBar />

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название, артикул или адрес товара"
            className={`${inputClass} pl-9`}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyOut} onChange={(e) => { setOnlyOut(e.target.checked); setPage(1); }} />
          Нет в наличии
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyHidden}
            onChange={(e) => { setOnlyHidden(e.target.checked); setPage(1); }}
          />
          Скрытые
        </label>
      </div>

      <Card className="overflow-hidden">
        {!data ? (
          <Empty>Загрузка…</Empty>
        ) : data.items.length === 0 ? (
          <Empty>Ничего не найдено</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground text-left bg-muted/50">
                <tr>
                  <th className="p-3 font-medium">Товар</th>
                  <th className="p-3 font-medium">Артикул</th>
                  <th className="p-3 font-medium text-right">Цена</th>
                  <th className="p-3 font-medium">Наличие</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((product) => (
                  <tr key={product.id} className={product.active ? "" : "opacity-55"}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-muted shrink-0 overflow-hidden">
                          {product.images[0] && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={productImageUrl(product.images[0])}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="line-clamp-1">{product.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.brand}
                            {!product.active && " · скрыт"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{product.sku || "—"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Money value={product.price} />
                      {product.old_price && (
                        <div className="text-xs text-muted-foreground line-through">
                          <Money value={product.old_price} />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={product.in_stock ? "text-success" : "text-muted-foreground"}>
                        {product.in_stock ? "В наличии" : "Нет"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setEditing(product.id)}
                        className="text-accent hover:underline whitespace-nowrap"
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
          >
            Назад
          </button>
          <span className="text-muted-foreground">
            {page} из {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
          >
            Дальше
          </button>
        </div>
      )}

      {editing !== null && (
        <ProductEditor
          productId={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

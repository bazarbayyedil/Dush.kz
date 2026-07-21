"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { astanaDelivery } from "@/lib/delivery";
import { useT } from "@/lib/i18n";

/** Что будет после покупки: срок, возврат, гарантия, документы. */
export function DeliveryPromise({ inStock }: { inStock: boolean }) {
  const t = useT();
  // Дату считаем после гидрации: на сервере и у клиента время разное,
  // иначе разметка разойдётся и React выбросит предупреждение.
  const [when, setWhen] = useState<string | null>(null);
  const [beforeCutoff, setBeforeCutoff] = useState(false);

  useEffect(() => {
    const estimate = astanaDelivery();
    setWhen(estimate.when);
    setBeforeCutoff(estimate.beforeCutoff);
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-border overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-success/10 text-success grid place-items-center">
          <Truck size={17} strokeWidth={2.1} />
        </span>
        <div className="text-sm leading-snug">
          {inStock ? (
            <>
              <div className="font-semibold">
                {t("promise.astana")}{" "}
                {when && <span className="text-success">{when}</span>}
              </div>
              <div className="text-muted-foreground text-[13px] mt-0.5">
                {beforeCutoff ? t("promise.cutoff") : t("promise.next_day")}
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">{t("promise.on_order")}</div>
              <div className="text-muted-foreground text-[13px] mt-0.5">{t("promise.on_order_text")}</div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border text-[13px]">
        <Promise icon={RotateCcw} href="/returns" text={t("promise.returns")} />
        <Promise icon={ShieldCheck} href="/warranty" text={t("promise.warranty")} />
        <Promise icon={PackageCheck} href="/delivery" text={t("promise.docs")} />
      </div>
    </div>
  );
}

function Promise({
  icon: Icon,
  href,
  text,
}: {
  icon: typeof Truck;
  href: string;
  text: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground">
      <Icon size={14} strokeWidth={2} className="shrink-0" />
      {text}
    </Link>
  );
}

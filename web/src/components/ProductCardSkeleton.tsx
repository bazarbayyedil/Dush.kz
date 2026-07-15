export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-3 w-20 rounded skeleton" />
        <div className="h-3 w-16 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-2/3 rounded skeleton" />
        <div className="h-5 w-24 rounded skeleton mt-1" />
        <div className="h-10 w-full rounded-xl skeleton mt-1" />
      </div>
    </div>
  );
}

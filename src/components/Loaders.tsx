export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive-foreground">
      <div className="font-semibold">Something went wrong</div>
      <div className="mt-1 text-destructive-foreground/80">
        {error instanceof Error ? error.message : String(error)}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return <div className="h-40 animate-pulse rounded-2xl bg-card" />;
}

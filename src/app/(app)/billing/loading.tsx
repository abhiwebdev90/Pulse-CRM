export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2"><div className="skeleton h-44" /><div className="skeleton h-44" /></div>
    </div>
  );
}

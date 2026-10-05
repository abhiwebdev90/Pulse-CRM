export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-96 w-64 shrink-0" />)}
      </div>
    </div>
  );
}

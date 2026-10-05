export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-10" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-14" />)}
    </div>
  );
}

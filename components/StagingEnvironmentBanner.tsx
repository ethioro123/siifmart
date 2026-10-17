export default function StagingEnvironmentBanner() {
  if (import.meta.env.MODE !== 'staging') return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[9999] bg-amber-500 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-black safe-area-inset-top"
    >
      Staging environment · Test data only
    </div>
  );
}

export default function StagingEnvironmentBanner() {
  if (import.meta.env.MODE !== 'staging') return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[9999] bg-[var(--theme-status-warning-bg)] flex items-center justify-center px-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-black"
      style={{ height: 'calc(1.5rem + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      Staging environment · Test data only
    </div>
  );
}

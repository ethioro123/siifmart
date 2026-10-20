import { useMemo, useState } from 'react';
import { Check, ExternalLink, Globe, PackageCheck, RefreshCw, ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useOnlineStoreManagement } from '../hooks/useOnlineStoreManagement';
import { canPublishOnlineProduct } from '../services/online-store.service';

function readableError(error: unknown) {
  return error instanceof Error ? error.message : 'The online store could not be updated.';
}

export default function OnlineStoreManagement() {
  const { activeSite, sites } = useData();
  const [notice, setNotice] = useState('');
  const storeSites = useMemo(() => sites.filter((site) => site.type === 'Dark Store' && site.status === 'Active' && site.country === activeSite?.country), [sites, activeSite?.country]);
  const initialStore = activeSite?.type === 'Dark Store' ? activeSite.id : storeSites[0]?.id || '';
  const [storeSiteId, setStoreSiteId] = useState(initialStore);
  const effectiveStoreSiteId = storeSites.some((site) => site.id === storeSiteId) ? storeSiteId : initialStore;
  const selectedStore = storeSites.find((site) => site.id === effectiveStoreSiteId);
  const management = useOnlineStoreManagement(effectiveStoreSiteId || undefined);
  const activeProducts = management.data?.products || [];
  const listings = management.data?.listings || [];
  const orders = management.data?.orders || [];
  const orderItems = management.data?.items || [];
  const loading = management.isPending || management.isFetching;
  const error = management.error ? readableError(management.error) : '';

  const toggleProduct = async (product: (typeof activeProducts)[number], published: boolean) => {
    if (!activeSite?.id) return;
    setNotice('');
    try {
      await management.publishMutation.mutateAsync({ product, published });
      setNotice(published ? `${product.name} is now published in the online store.` : `${product.name} was removed from the online store.`);
    } catch { /* Query error is displayed from the mutation below. */ }
  };

  const updateOrder = async (order: (typeof orders)[number], status: 'accepted' | 'rejected') => {
    setNotice('');
    try {
      await management.orderMutation.mutateAsync({ orderId: order.id, status });
      setNotice(`${order.order_number} ${status}. No payment or inventory was recorded.`);
    } catch { /* Query error is displayed from the mutation below. */ }
  };

  const isPublished = (productId: string) => listings.some((listing) => listing.product_id === productId && listing.is_published);
  const eligible = canPublishOnlineProduct;
  const formatAmount = (order: (typeof orders)[number]) => new Intl.NumberFormat(order.country_code === 'ET' ? 'en-ET' : 'en-KE', { style: 'currency', currency: order.currency }).format(Number(order.merchandise_subtotal));

  if (!activeSite) return <div className="p-8 text-sm text-stone-600">Choose an authorized site to manage its online store.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Commerce</p><h1 className="mt-1 text-3xl font-semibold text-stone-900 dark:text-white">Online store</h1><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{selectedStore?.country || activeSite.country}</p></div>
        <div className="flex gap-2"><a href="/shop/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-white/5"><ExternalLink size={16} /> Preview shop</a><button onClick={() => void management.refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-white/5"><RefreshCw size={16} /> Refresh</button></div>
      </header>

      {storeSites.length > 0 && <label className="grid max-w-sm gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Online store location<select value={effectiveStoreSiteId} onChange={(event) => setStoreSiteId(event.target.value)} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white">{storeSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-[#1E2822]">
        <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"><PackageCheck size={20} /></div><div><h2 className="text-lg font-semibold text-stone-900 dark:text-white">Published catalog</h2><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Only active, approved products with stock can be published. The public catalog hides internal cost and stock figures.</p></div></div>
        {(error || management.publishMutation.error || management.orderMutation.error) && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error || readableError(management.publishMutation.error || management.orderMutation.error)}</div>}{notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</div>}
        {!storeSites.length ? <p className="py-8 text-center text-sm text-stone-500">No active online fulfillment stores are available in this scope.</p> : loading ? <p className="py-8 text-center text-sm text-stone-500">Loading catalog…</p> : activeProducts.length ? <div className="divide-y divide-stone-100 dark:divide-stone-700">{activeProducts.map((product) => {
          const published = isPublished(product.id);
          const canPublish = eligible(product);
          return <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate font-medium text-stone-900 dark:text-white">{product.name}</p><p className="mt-1 text-xs text-stone-500">{product.sku} · {product.category} · {product.stock} on hand</p></div><button disabled={management.publishMutation.isPending || (!published && !canPublish)} onClick={() => void toggleProduct(product, !published)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${published ? 'border border-stone-300 text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200' : 'bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40'}`}>
            {published ? <><Check size={15} /> Published · remove</> : <><Globe size={15} /> {canPublish ? 'Publish' : 'Not ready'}</>}
          </button></div>;
        })}</div> : <div className="py-8 text-center text-sm text-stone-500">No products are available at this site yet.</div>}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-[#1E2822]">
        <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"><ShoppingBag size={20} /></div><div><h2 className="text-lg font-semibold text-stone-900 dark:text-white">Order requests</h2><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Accepting confirms the store will follow up. It does not take payment, reserve stock, or create a POS sale.</p></div></div>
        {orders.length ? <div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-xl border border-stone-200 p-4 dark:border-stone-700">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-stone-900 dark:text-white">{order.order_number}</h3><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs capitalize text-stone-700 dark:bg-white/10 dark:text-stone-200">{order.status.replaceAll('_', ' ')}</span></div><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{order.customer_name} · {order.customer_phone}</p><p className="mt-1 text-xs text-stone-500">{order.fulfillment_method === 'delivery' ? `Delivery · ${order.delivery_address}` : 'Store pickup'} · {order.payment_method === 'cash_on_pickup' ? 'Pay at pickup' : 'Cash on delivery'}</p></div><strong className="text-sm tabular-nums text-stone-900 dark:text-white">{formatAmount(order)}</strong></div>
          <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-200">{orderItems.filter((item) => item.order_id === order.id).map((item) => <li key={`${order.id}:${item.sku}`} className="flex justify-between gap-3"><span>{item.quantity} × {item.product_name}</span><span className="tabular-nums">{formatAmount({ ...order, merchandise_subtotal: item.line_subtotal })}</span></li>)}</ul>
          {order.status === 'awaiting_confirmation' && <div className="mt-4 flex justify-end gap-2"><button disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'rejected')} className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:text-stone-200">Decline</button><button disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'accepted')} className="min-h-10 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">Accept request</button></div>}
        </article>)}</div> : <p className="py-8 text-center text-sm text-stone-500">No order requests for this site.</p>}
      </section>
      <p className="text-xs text-stone-500">Order totals show merchandise subtotal only. Confirm tax, delivery, stock, and final payment amount with the customer before proceeding.</p>
    </div>
  );
}

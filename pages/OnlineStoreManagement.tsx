import { useMemo, useState } from 'react';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { useOnlineStoreManagement } from '../hooks/useOnlineStoreManagement';
import { canPublishOnlineProduct } from '../services/online-store.service';

function readableError(error: unknown) {
  return error instanceof Error ? error.message : 'The online store could not be updated.';
}

export default function OnlineStoreManagement() {
  const { user } = useStore();
  const { activeSite, sites } = useData();
  const role = user?.role?.toLowerCase() || '';
  const canManageOrders = ['warehouse_manager', 'operations_manager', 'logistics_manager', 'regional_logistics_lead', 'admin', 'super_admin', 'ceo'].includes(role);
  const [notice, setNotice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const storeSites = useMemo(() => sites.filter((site) => site.type === 'Warehouse' && site.status === 'Active' && site.country === activeSite?.country), [sites, activeSite?.country]);
  const initialStore = activeSite?.type === 'Warehouse' ? activeSite.id : storeSites[0]?.id || '';
  const [storeSiteId, setStoreSiteId] = useState(initialStore);
  const effectiveStoreSiteId = storeSites.some((site) => site.id === storeSiteId) ? storeSiteId : initialStore;
  const selectedStore = storeSites.find((site) => site.id === effectiveStoreSiteId);
  const management = useOnlineStoreManagement(effectiveStoreSiteId || undefined, canManageOrders);
  const activeProducts = management.data?.products || [];
  const orders = management.data?.orders || [];
  const orderItems = management.data?.items || [];
  const jobs = management.data?.jobs || [];
  const loading = management.isPending || management.isFetching;
  const error = management.error ? readableError(management.error) : '';

  const addItem = () => {
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || items.some((item) => item.productId === productId)) return;
    setItems((current) => [...current, { productId, quantity }]);
    setProductId('');
    setQuantity(1);
  };

  const saveOrder = async () => {
    setNotice('');
    try {
      const number = await management.intakeMutation.mutateAsync({ customerName, customerPhone, deliveryAddress, items });
      setCustomerName(''); setCustomerPhone(''); setDeliveryAddress(''); setItems([]);
      setNotice(`${number}: order saved for warehouse review.`);
    } catch { /* Mutation error is shown below. */ }
  };

  const updateOrder = async (order: (typeof orders)[number], status: 'accepted' | 'rejected') => {
    setNotice('');
    try {
      await management.orderMutation.mutateAsync({ orderId: order.id, status });
      setNotice(status === 'accepted' ? `${order.order_number}: stock reserved and a warehouse PICK job created.` : `${order.order_number}: request declined.`);
    } catch { /* Query error is displayed from the mutation below. */ }
  };

  const formatAmount = (order: (typeof orders)[number]) => new Intl.NumberFormat(order.country_code === 'ET' ? 'en-ET' : 'en-KE', { style: 'currency', currency: order.currency }).format(Number(order.merchandise_subtotal));

  if (!activeSite) return <div className="p-8 text-sm text-stone-600">Choose an authorized warehouse for online orders.</div>;
  if (!canManageOrders) return <div className="p-8 text-sm text-stone-600">This role cannot manage online orders.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Commerce</p><h1 className="mt-1 text-3xl font-semibold text-stone-900 dark:text-white">Online operations</h1><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Staff order intake and warehouse fulfillment · {selectedStore?.country || activeSite.country}</p></div>
        <div className="flex gap-2"><button onClick={() => void management.refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-white/5"><RefreshCw size={16} /> Refresh</button></div>
      </header>

      {storeSites.length > 0 && <label className="grid max-w-sm gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">Fulfillment warehouse<select value={effectiveStoreSiteId} onChange={(event) => setStoreSiteId(event.target.value)} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium normal-case tracking-normal text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white">{storeSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>}

      {(error || management.intakeMutation.error || management.orderMutation.error) && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error || readableError(management.intakeMutation.error || management.orderMutation.error)}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</div>}

      {canManageOrders && <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-[#1E2822]">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Enter an order</h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Record an order received by staff. Warehouse leadership reviews stock before picking begins.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">Customer name<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white" /></label>
          <label className="grid gap-1 text-sm">Customer phone<input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} maxLength={32} type="tel" className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white" /></label>
          <label className="grid gap-1 text-sm md:col-span-2">Delivery address<textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} maxLength={500} rows={2} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white" /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid min-w-48 flex-1 gap-1 text-sm">Warehouse product<select value={productId} onChange={(event) => setProductId(event.target.value)} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white"><option value="">Select a product</option>{activeProducts.filter(canPublishOnlineProduct).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
          <label className="grid w-24 gap-1 text-sm">Quantity<input type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3 text-stone-900 dark:border-stone-600 dark:bg-[#1E2822] dark:text-white" /></label>
          <button onClick={addItem} disabled={!productId || items.length >= 20} className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-medium disabled:opacity-50 dark:border-stone-600">Add item</button>
        </div>
        {items.length > 0 && <ul className="mt-4 divide-y divide-stone-200 dark:divide-stone-700">{items.map((item) => <li key={item.productId} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{item.quantity} × {activeProducts.find((product) => product.id === item.productId)?.name}</span><button onClick={() => setItems((current) => current.filter((entry) => entry.productId !== item.productId))} className="text-red-700 dark:text-red-300">Remove</button></li>)}</ul>}
        <div className="mt-4 flex justify-end"><button onClick={() => void saveOrder()} disabled={!effectiveStoreSiteId || !customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim() || !items.length || management.intakeMutation.isPending} className="min-h-11 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-50">Save order for review</button></div>
      </section>}

      {canManageOrders && <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-[#1E2822]">
        <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"><ShoppingBag size={20} /></div><div><h2 className="text-lg font-semibold text-stone-900 dark:text-white">Warehouse order queue</h2><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Accepting reserves warehouse stock and queues a PICK job. Payment remains unpaid until collected.</p></div></div>
        {orders.length ? <div className="space-y-4">{orders.map((order) => {
          const orderJobs = jobs.filter((job) => job.order_ref === order.id);
          return <article key={order.id} className="rounded-xl border border-stone-200 p-4 dark:border-stone-700">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-stone-900 dark:text-white">{order.order_number}</h3><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs capitalize text-stone-700 dark:bg-white/10 dark:text-stone-200">{order.status.replaceAll('_', ' ')}</span></div><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{order.customer_name} · {order.customer_phone}</p><p className="mt-1 text-xs text-stone-500">Delivery · {order.delivery_address} · Cash on delivery · {order.payment_status}</p>{order.status_updated_at && <p className="mt-1 text-xs text-stone-500">Decision recorded {new Date(order.status_updated_at).toLocaleString()}</p>}</div><strong className="text-sm tabular-nums text-stone-900 dark:text-white">{formatAmount(order)}</strong></div>
            <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-200">{orderItems.filter((item) => item.order_id === order.id).map((item) => <li key={`${order.id}:${item.sku}`} className="flex justify-between gap-3"><span>{item.quantity} × {item.product_name}</span><span className="tabular-nums">{formatAmount({ ...order, merchandise_subtotal: item.line_subtotal })}</span></li>)}</ul>
            {orderJobs.length > 0 && <p className="mt-3 text-xs text-stone-600 dark:text-stone-300">Warehouse: {orderJobs.map((job) => `${job.type.toLowerCase()} ${job.transfer_status || job.status}`).join(' · ')}</p>}
            {order.status === 'awaiting_confirmation' && <div className="mt-4 flex justify-end gap-2"><button disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'rejected')} className="min-h-10 rounded-lg border border-stone-300 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:text-stone-200">Decline</button><button disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'accepted')} className="min-h-10 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">Reserve and queue pick</button></div>}
          </article>;
        })}</div> : <p className="py-8 text-center text-sm text-stone-500">No orders for this warehouse.</p>}
      </section>}
      <p className="text-xs text-stone-500">Order totals show merchandise subtotal only. Confirm tax, delivery charges, and the final payment amount before dispatch.</p>
    </div>
  );
}

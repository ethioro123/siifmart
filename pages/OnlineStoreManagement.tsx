import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { useOnlineStoreManagement } from '../hooks/useOnlineStoreManagement';
import { canSelectOnlineProduct } from '../services/online-store.service';

function readableError(error: unknown) {
  return error instanceof Error ? error.message : 'Online operations could not be updated.';
}

export default function OnlineStoreManagement() {
  const { user } = useStore();
  const { activeSite, sites } = useData();
  const role = user?.role?.toLowerCase() || '';
  const canManageOrders = ['warehouse_manager', 'head_of_operations', 'logistics_manager', 'regional_logistics_manager', 'admin', 'super_admin', 'ceo'].includes(role);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const fulfillmentSites = useMemo(() => sites.filter((site) =>
    (site.type === 'Warehouse' || site.type === 'Distribution Center') &&
    site.status === 'Active' && site.country === activeSite?.country
  ), [sites, activeSite?.country]);
  const initialFacility = activeSite && fulfillmentSites.some((site) => site.id === activeSite.id) ? activeSite.id : fulfillmentSites[0]?.id || '';
  const [facilitySiteId, setFacilitySiteId] = useState(initialFacility);
  const effectiveFacilitySiteId = fulfillmentSites.some((site) => site.id === facilitySiteId) ? facilitySiteId : initialFacility;
  const selectedFacility = fulfillmentSites.find((site) => site.id === effectiveFacilitySiteId);
  const management = useOnlineStoreManagement(effectiveFacilitySiteId || undefined, canManageOrders, selectedFacility?.country, user?.id);
  const activeProducts = management.data?.products || [];
  const orders = management.data?.orders || [];
  const orderItems = management.data?.items || [];
  const jobs = management.data?.jobs || [];
  const loading = management.isPending || management.isFetching;
  const error = management.error ? readableError(management.error) : '';
  const incompleteDetails = [
    customerName.trim().length < 2 && 'customer name (at least 2 characters)',
    customerPhone.trim().length < 7 && 'customer phone (at least 7 characters)',
    deliveryAddress.trim().length < 5 && 'delivery address (at least 5 characters)',
    items.length === 0 && 'an item',
  ].filter((detail): detail is string => Boolean(detail));

  useEffect(() => {
    setCustomerName(''); setCustomerPhone(''); setDeliveryAddress('');
    setProductId(''); setQuantity(1); setItems([]); setNotice(''); setFormError('');
  }, [effectiveFacilitySiteId]);

  useEffect(() => { setFormError(''); }, [customerName, customerPhone, deliveryAddress, items]);

  const addItem = () => {
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || items.some((item) => item.productId === productId)) return;
    setItems((current) => [...current, { productId, quantity }]);
    setProductId('');
    setQuantity(1);
  };

  const saveOrder = async () => {
    setNotice('');
    if (incompleteDetails.length) {
      setFormError(`Complete ${incompleteDetails.join(', ')} before saving.`);
      return;
    }
    setFormError('');
    try {
      const number = await management.intakeMutation.mutateAsync({ customerName, customerPhone, deliveryAddress, items });
      setCustomerName(''); setCustomerPhone(''); setDeliveryAddress(''); setItems([]);
      setNotice(`${number}: order saved for fulfillment review.`);
    } catch (saveError) { setFormError(readableError(saveError)); }
  };

  const updateOrder = async (order: (typeof orders)[number], status: 'accepted' | 'rejected') => {
    setNotice('');
    try {
      await management.orderMutation.mutateAsync({ orderId: order.id, status });
      setNotice(status === 'accepted' ? `${order.order_number}: stock reserved and a PICK job created.` : `${order.order_number}: request declined.`);
    } catch { /* Query error is displayed from the mutation below. */ }
  };

  const formatAmount = (order: (typeof orders)[number]) => new Intl.NumberFormat(order.country_code === 'ET' ? 'en-ET' : 'en-KE', { style: 'currency', currency: order.currency }).format(Number(order.merchandise_subtotal));

  if (!activeSite) return <div className="p-8 text-sm text-[var(--theme-text-secondary)]">Choose an authorized warehouse or distribution center for online orders.</div>;
  if (!canManageOrders) return <div className="p-8 text-sm text-[var(--theme-text-secondary)]">This role cannot manage online orders.</div>;
  if (!selectedFacility) return <div className="p-8 text-sm text-[var(--theme-text-secondary)]">No active warehouse or distribution center is available in this country.</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-text-secondary)]">Commerce</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[var(--theme-text-primary)]">Online operations</h1>
          <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">Staff order intake and fulfillment · {selectedFacility?.country || activeSite.country}</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void management.refetch()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-4 text-sm font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {fulfillmentSites.length > 0 && (
        <label className="grid max-w-sm gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--theme-text-secondary)]">
          Fulfillment facility
          <select
            value={effectiveFacilitySiteId}
            onChange={(event) => setFacilitySiteId(event.target.value)}
            className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-sm font-medium normal-case tracking-normal text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            {fulfillmentSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </label>
      )}

      {(error || management.orderMutation.error) && (
        <div className="rounded-xl border border-[var(--theme-status-danger-border)] bg-[var(--theme-status-danger-bg)] p-3 text-sm text-[var(--theme-status-danger-text)]" role="alert">
          {error || readableError(management.orderMutation.error)}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-[var(--theme-status-success-border)] bg-[var(--theme-status-success-bg)] p-3 text-sm text-[var(--theme-status-success-text)]" role="status">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">Enter an order</h2>
        <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Record an order received by staff. Fulfillment leadership reviews stock before picking begins.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm text-[var(--theme-text-primary)]">
            Customer name
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} minLength={2} maxLength={120} required className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
          </label>
          <label className="grid gap-1 text-sm text-[var(--theme-text-primary)]">
            Customer phone
            <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} minLength={7} maxLength={32} required type="tel" className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
          </label>
          <label className="grid gap-1 text-sm text-[var(--theme-text-primary)] md:col-span-2">
            Delivery address
            <textarea value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} minLength={5} maxLength={500} rows={2} required className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 py-2 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid min-w-48 flex-1 gap-1 text-sm text-[var(--theme-text-primary)]">
            Facility product
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
              <option value="">Select a product</option>
              {activeProducts.filter(canSelectOnlineProduct).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}
            </select>
          </label>
          <label className="grid w-24 gap-1 text-sm text-[var(--theme-text-primary)]">
            Quantity
            <input type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-card)] px-3 text-[var(--theme-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
          </label>
          <button type="button" onClick={addItem} disabled={!productId || items.length >= 20} className="min-h-11 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] px-4 text-sm font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
            Add item
          </button>
        </div>

        {items.length > 0 && (
          <ul className="mt-4 divide-y divide-[var(--theme-border)]">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 py-2 text-sm text-[var(--theme-text-primary)]">
                <span>{item.quantity} × {activeProducts.find((product) => product.id === item.productId)?.name}</span>
                <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.productId !== item.productId))} className="min-h-11 rounded-lg px-3 text-[var(--theme-status-danger-text)] hover:bg-[var(--theme-status-danger-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => void saveOrder()} disabled={!effectiveFacilitySiteId || management.intakeMutation.isPending} className="min-h-11 rounded-lg bg-[var(--theme-btn-primary-bg)] px-4 text-sm font-semibold text-[var(--theme-btn-primary-text)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
            {management.intakeMutation.isPending ? 'Saving order…' : 'Save order for review'}
          </button>
        </div>
        {incompleteDetails.length > 0 && <p className="mt-2 text-sm text-[var(--theme-text-secondary)]">To save, complete: {incompleteDetails.join(', ')}.</p>}
        {formError && <p className="mt-2 text-sm text-[var(--theme-status-danger-text)]" role="alert">{formError}</p>}
      </section>

      <section className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-card)] p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-[var(--theme-status-warning-bg)] p-2.5 text-[var(--theme-status-warning-text)]"><ShoppingBag size={20} /></div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">Fulfillment order queue</h2>
            <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">Accepting reserves facility stock and queues a PICK job. Payment remains unpaid until collected.</p>
          </div>
        </div>
        {orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderJobs = jobs.filter((job) => job.order_ref === order.id);
              return (
                <article key={order.id} className="rounded-xl border border-[var(--theme-border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--theme-text-primary)]">{order.order_number}</h3>
                        <span className="rounded-full bg-[var(--theme-bg-subtle)] px-2.5 py-1 text-xs capitalize text-[var(--theme-text-secondary)]">{order.status.replaceAll('_', ' ')}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--theme-text-secondary)]">{order.customer_name} · {order.customer_phone}</p>
                      <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Delivery · {order.delivery_address} · Cash on delivery · {order.payment_status}</p>
                      {order.status_updated_at && <p className="mt-1 text-xs text-[var(--theme-text-muted)]">Decision recorded {new Date(order.status_updated_at).toLocaleString()}</p>}
                    </div>
                    <strong className="text-sm tabular-nums text-[var(--theme-text-primary)]">{formatAmount(order)}</strong>
                  </div>
                  <ul className="mt-3 space-y-1 border-t border-[var(--theme-border)] pt-3 text-sm text-[var(--theme-text-secondary)]">
                    {orderItems.filter((item) => item.order_id === order.id).map((item) => (
                      <li key={`${order.id}:${item.sku}`} className="flex justify-between gap-3">
                        <span>{item.quantity} × {item.product_name}</span>
                        <span className="tabular-nums">{formatAmount({ ...order, merchandise_subtotal: item.line_subtotal })}</span>
                      </li>
                    ))}
                  </ul>
                  {orderJobs.length > 0 && <p className="mt-3 text-xs text-[var(--theme-text-secondary)]">Fulfillment: {orderJobs.map((job) => `${job.type.toLowerCase()} ${job.transfer_status || job.status}`).join(' · ')}</p>}
                  {order.status === 'awaiting_confirmation' && (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button type="button" disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'rejected')} className="min-h-11 rounded-lg border border-[var(--theme-border)] px-3 text-sm font-medium text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-subtle)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Decline</button>
                      <button type="button" disabled={management.orderMutation.isPending} onClick={() => void updateOrder(order, 'accepted')} className="min-h-11 rounded-lg bg-[var(--theme-btn-primary-bg)] px-3 text-sm font-semibold text-[var(--theme-btn-primary-text)] hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">Reserve and queue pick</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : <p className="py-8 text-center text-sm text-[var(--theme-text-muted)]">No orders for this facility.</p>}
      </section>

      <p className="text-xs text-[var(--theme-text-muted)]">Order totals show merchandise subtotal only. Confirm tax, delivery charges, and the final payment amount before dispatch.</p>
    </div>
  );
}

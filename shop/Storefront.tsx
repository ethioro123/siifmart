import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type CountryCode = 'ET' | 'KE';
type StoreSite = { id: string; name: string; country: CountryCode; currency: string; region_code: string | null };
type StoreProduct = {
  id: string; site_id: string; name: string; sku: string; category: string | null;
  description: string | null; brand: string | null; size: string | null; image: string | null;
  price: number; currency: string;
};
type CartLine = { product: StoreProduct; quantity: number };
type StoreResponse = { sites: StoreSite[]; products: StoreProduct[] };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const currencyLocale: Record<CountryCode, string> = { ET: 'en-ET', KE: 'en-KE' };

function formatMoney(amount: number, currency: string, country: CountryCode) {
  return new Intl.NumberFormat(currencyLocale[country], { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export function Storefront() {
  const [country, setCountry] = useState<CountryCode>('ET');
  const [sites, setSites] = useState<StoreSite[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [siteId, setSiteId] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setCategory('All');
    setCart([]);
    setMessage('');
    if (!supabase) {
      setError('The shop connection is not configured yet.');
      setLoading(false);
      return () => { alive = false; };
    }
    supabase.functions.invoke<StoreResponse>(`storefront-api?country=${country}`)
      .then(({ data, error: invokeError }) => {
        if (!alive) return;
        if (invokeError || !data) setError('We could not load the shop right now. Please try again.');
        else {
          setSites(data.sites || []);
          setProducts(data.products || []);
          setSiteId((current) => data.sites.some((site) => site.id === current) ? current : data.sites[0]?.id || '');
        }
      })
      .catch(() => { if (alive) setError('We could not load the shop right now. Please try again.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [country]);

  const selectedSite = sites.find((site) => site.id === siteId);
  const siteProducts = products.filter((product) => product.site_id === siteId);
  const categories = useMemo(() => ['All', ...new Set(siteProducts.map((product) => product.category).filter((item): item is string => Boolean(item)))], [siteProducts]);
  const visibleProducts = siteProducts.filter((product) => category === 'All' || product.category === category);
  const cartLines = cart.filter((line) => line.product.site_id === siteId);
  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (product: StoreProduct) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id && line.product.site_id === product.site_id);
      if (found) return current.map((line) => line === found ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line);
      return [...current, { product, quantity: 1 }];
    });
    setMessage('Added to your basket.');
  };

  const setQuantity = (productId: string, quantity: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId && line.product.site_id === siteId ? { ...line, quantity } : line)
      .filter((line) => line.quantity > 0));
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !selectedSite || !cartLines.length) return;
    setSubmitting(true);
    setError('');
    const { data, error: submitError } = await supabase.functions.invoke('storefront-api', {
      body: {
        countryCode: country,
        siteId: selectedSite.id,
        customerName,
        customerPhone,
        fulfillmentMethod: fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? deliveryAddress : null,
        items: cartLines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      },
    });
    setSubmitting(false);
    if (submitError || !data?.orderNumber) {
      setError(data?.error || 'We could not submit your order request. Please try again.');
      return;
    }
    setCart([]);
    setCheckoutOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setMessage(`Request ${data.orderNumber} received. The store must confirm stock, tax and delivery before accepting it. Payment remains unpaid.`);
  };

  return (
    <div className="storefront">
      <header className="store-header">
        <a className="store-brand" href="/shop/" aria-label="SIIFMART shop home"><span className="brand-mark">S</span><span>SIIFMART <small>SHOP</small></span></a>
        <nav className="country-tabs" aria-label="Choose country">
          <button className={country === 'ET' ? 'active' : ''} onClick={() => setCountry('ET')}>Ethiopia</button>
          <button className={country === 'KE' ? 'active' : ''} onClick={() => setCountry('KE')}>Kenya</button>
        </nav>
        <button className="basket-link" onClick={() => setCheckoutOpen(true)} disabled={!cartCount} aria-label={`Basket, ${cartCount} items`}>
          Basket <span>{cartCount}</span>
        </button>
      </header>

      <main>
        <section className="store-hero">
          <div><p className="eyebrow">LOCAL SHOPPING, MADE SIMPLE</p><h1>Everyday essentials,<br /><em>closer to home.</em></h1><p>Browse products from your local SIIFMART store and send an order request for delivery or pickup.</p></div>
          <div className="hero-stamp"><span>ET</span><span className="stamp-line" /><span>KE</span><small>Two local markets</small></div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="catalog-heading"><div><p className="eyebrow">THE CATALOG</p><h2 id="catalog-title">Shop your area</h2></div>
            <label className="site-select">Your store<select value={siteId} onChange={(event) => { setSiteId(event.target.value); setCategory('All'); }} disabled={!sites.length}>
              {sites.map((site) => <option value={site.id} key={site.id}>{site.name}</option>)}
            </select></label>
          </div>
          {categories.length > 1 && <div className="category-list" aria-label="Filter products by category">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'selected' : ''}>{item}</button>)}</div>}
          {message && <div className="notice" role="status"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}
          {error && <div className="notice error" role="alert">{error}</div>}
          {loading ? <div className="catalog-state">Loading your local catalog…</div> : visibleProducts.length ? (
            <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={`${product.site_id}:${product.id}`}>
              <div className="product-image">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <span>{product.category?.slice(0, 1) || 'S'}</span>}</div>
              <div className="product-info"><p className="product-category">{product.category || 'Essentials'}{product.size ? ` · ${product.size}` : ''}</p><h3>{product.name}</h3>{product.brand && <p className="product-brand">{product.brand}</p>}
                <div className="product-footer"><strong>{formatMoney(product.price, product.currency, country)}</strong><button onClick={() => addToCart(product)} aria-label={`Add ${product.name} to basket`}>Add <span aria-hidden="true">+</span></button></div>
              </div>
            </article>)}</div>
          ) : <div className="catalog-state"><span className="empty-mark">S</span><h3>{sites.length ? 'We are getting this store ready.' : 'Online shopping is not available here yet.'}</h3><p>{sites.length ? 'Products will appear here when the local team publishes the catalog.' : 'Choose another market or check back soon.'}</p></div>}
        </section>
      </main>

      <footer className="store-footer"><span>SIIFMART · Local by design</span><span>Online payment is not available yet. Orders are confirmed by the store.</span></footer>

      {checkoutOpen && <div className="checkout-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCheckoutOpen(false); }}>
        <section className="checkout-panel" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <div className="checkout-header"><div><p className="eyebrow">ORDER REQUEST</p><h2 id="checkout-title">Your basket</h2></div><button className="close-button" onClick={() => setCheckoutOpen(false)} aria-label="Close basket">×</button></div>
          <div className="checkout-lines">{cartLines.map((line) => <div className="checkout-line" key={line.product.id}><div><strong>{line.product.name}</strong><span>{formatMoney(line.product.price, line.product.currency, country)} each</span></div><div className="quantity-control"><button onClick={() => setQuantity(line.product.id, line.quantity - 1)} aria-label={`Remove one ${line.product.name}`}>−</button><span>{line.quantity}</span><button onClick={() => setQuantity(line.product.id, line.quantity + 1)} aria-label={`Add one ${line.product.name}`}>+</button></div></div>)}</div>
          <div className="subtotal-line"><span>Merchandise subtotal</span><strong>{formatMoney(subtotal, selectedSite?.currency || (country === 'ET' ? 'ETB' : 'KES'), country)}</strong></div>
          <p className="checkout-note">This is a product subtotal only. The store will confirm availability, applicable tax, and any delivery charge before accepting your request. No payment is taken online.</p>
          <form className="checkout-form" onSubmit={submitOrder}>
            <label>Your name<input required minLength={2} maxLength={120} value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" /></label>
            <label>Phone number<input required minLength={7} maxLength={32} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} autoComplete="tel" inputMode="tel" /></label>
            <fieldset><legend>How would you like your order?</legend><label className="radio-row"><input type="radio" checked={fulfillment === 'delivery'} onChange={() => setFulfillment('delivery')} /> Delivery · cash on delivery</label><label className="radio-row"><input type="radio" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} /> Pickup · pay at store</label></fieldset>
            {fulfillment === 'delivery' && <label>Delivery address<textarea required minLength={5} maxLength={500} rows={2} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} autoComplete="street-address" /></label>}
            {error && <div className="notice error" role="alert">{error}</div>}
            <button className="submit-order" type="submit" disabled={submitting || !cartLines.length}>{submitting ? 'Sending request…' : 'Send order request'}</button>
          </form>
        </section>
      </div>}
    </div>
  );
}

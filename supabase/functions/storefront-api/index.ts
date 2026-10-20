// @ts-nocheck — Supabase Edge Function runs on Deno.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return json({ error: 'Store service is unavailable.' }, 503)

  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  if (req.method === 'GET') {
    const country = new URL(req.url).searchParams.get('country')?.toUpperCase()
    if (country !== 'ET' && country !== 'KE') return json({ error: 'Choose Ethiopia or Kenya.' }, 400)

    const { data: sites, error: sitesError } = await db.from('sites')
      .select('id,name,country,currency,region_code')
      .eq('status', 'Active').eq('type', 'Warehouse').eq('country', country)
      .order('name').limit(20)
    if (sitesError) return json({ error: 'Store locations could not be loaded.' }, 500)
    const siteIds = (sites || []).map((site) => site.id)
    if (!siteIds.length) return json({ sites: [], products: [] })

    const { data: listings, error: listingError } = await db.from('storefront_catalog')
      .select('site_id,product_id').eq('is_published', true).in('site_id', siteIds).limit(500)
    if (listingError) return json({ error: 'The product catalog could not be loaded.' }, 500)
    const productIds = [...new Set((listings || []).map((entry) => entry.product_id))]
    if (!productIds.length) return json({ sites, products: [] })

    const { data: products, error: productError } = await db.from('products')
      .select('id,site_id,name,sku,category,description,brand,size,image,price,sale_price,is_on_sale,status,approval_status,stock')
      .in('id', productIds).in('site_id', siteIds).eq('status', 'active').eq('approval_status', 'approved')
      .gt('stock', 0).limit(500)
    if (productError) return json({ error: 'The product catalog could not be loaded.' }, 500)

    const prohibited = /(beer|wine|vodka|whisky|whiskey|gin|rum|tequila|alcohol|liquor)/i
    const published = new Set((listings || []).map((entry) => `${entry.site_id}:${entry.product_id}`))
    const safeProducts = (products || []).filter((product) =>
      published.has(`${product.site_id}:${product.id}`) &&
      !prohibited.test(`${product.name || ''} ${product.category || ''}`),
    ).map(({ id, site_id, name, sku, category, description, brand, size, image, price, sale_price, is_on_sale }) => ({
      id, site_id, name, sku, category, description, brand, size, image,
      price: is_on_sale && sale_price !== null ? sale_price : price,
      currency: sites?.find((site) => site.id === site_id)?.currency || (country === 'ET' ? 'ETB' : 'KES'),
    }))

    return json({ sites, products: safeProducts })
  }

  if (req.method === 'POST') {
    let body: unknown
    try { body = await req.json() } catch { return json({ error: 'Invalid request.' }, 400) }
    if (!isRecord(body) || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      return json({ error: 'Your cart is empty or too large.' }, 400)
    }

    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : ''
    const fulfillmentMethod = body.fulfillmentMethod
    const deliveryAddress = typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : null
    const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : ''
    const siteId = typeof body.siteId === 'string' ? body.siteId : ''
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuid.test(siteId) || !['ET', 'KE'].includes(countryCode) ||
        customerName.length < 2 || customerName.length > 120 ||
        customerPhone.length < 7 || customerPhone.length > 32 ||
        fulfillmentMethod !== 'delivery' ||
        (fulfillmentMethod === 'delivery' && (!deliveryAddress || deliveryAddress.length < 5 || deliveryAddress.length > 500))) {
      return json({ error: 'Check your contact, location, and fulfillment details.' }, 400)
    }

    const items = body.items.map((item) => {
      if (!isRecord(item) || typeof item.productId !== 'string' || !uuid.test(item.productId) ||
          !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) return null
      return { product_id: item.productId, quantity: Number(item.quantity) }
    })
    if (items.some((item) => item === null)) return json({ error: 'A cart item is invalid.' }, 400)

    const { data, error } = await db.rpc('submit_storefront_order', {
      p_site_id: siteId,
      p_country_code: countryCode,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_fulfillment_method: fulfillmentMethod,
      p_delivery_address: deliveryAddress,
      p_items: items,
    }).single()
    if (error) return json({ error: 'We could not submit this order request. Please review your cart and try again.' }, 400)

    return json({
      orderNumber: data.order_number,
      merchandiseSubtotal: data.merchandise_subtotal,
      currency: data.currency,
      status: 'awaiting_confirmation',
      paymentStatus: 'unpaid',
    }, 201)
  }

  return json({ error: 'Method not allowed.' }, 405)
})

// @ts-nocheck — Supabase Edge Function runs on Deno.
// The public storefront is closed while online orders are entered by authenticated staff.
Deno.serve(() => new Response(JSON.stringify({ error: 'Online operations are staff only.' }), {
  status: 410,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
}));

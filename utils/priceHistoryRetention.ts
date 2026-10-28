export type PriceHistoryWindow = '12months' | 'all';
export function priceHistorySince(window: PriceHistoryWindow, now = new Date()): string | null {
  if (window === 'all') return null;
  const date=new Date(now);const month=date.getUTCMonth();date.setUTCFullYear(date.getUTCFullYear()-1);
  if(date.getUTCMonth()!==month) date.setUTCDate(0);
  return date.toISOString();
}

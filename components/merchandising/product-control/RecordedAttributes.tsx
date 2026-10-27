import type { Product } from '../../../types';
import { ControlFact } from './ControlPrimitives';
const allowed = new Set(['identity', 'categorySpecific', 'physical', 'packaging', 'commercial', 'descriptive', 'technical', 'logistics', 'regulatory', 'storage', 'quality', 'compliance', 'dietary', 'nutrition', 'safety', 'warranty', 'specifications']);
function fields(value: unknown, path: string[] = []): Array<[string, string]> {
    if (value === null || value === undefined || value === '') return [];
    if (Array.isArray(value)) return [[path.join(' · '), value.filter(item => typeof item !== 'object').join(', ')]];
    if (typeof value !== 'object') return [[path.join(' · '), typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)]];
    return Object.entries(value).flatMap(([key, item]) => /cost|price|margin|finance|credential|password|token/i.test(key) ? [] : fields(item, [...path, key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')]));
}
export function RecordedAttributes({ product }: { product: Product }) {
    const attrs = product.customAttributes || product.custom_attributes || {};
    const rows = Object.entries(attrs).filter(([key]) => allowed.has(key)).flatMap(([key, value]) => fields(value, [key]));
    if (!rows.length) return null;
    return <details className="rounded-xl border border-[var(--theme-border)] p-4"><summary className="min-h-[44px] cursor-pointer text-sm font-medium">Additional recorded specifications ({rows.length})</summary><dl className="grid gap-4 pt-3 sm:grid-cols-2">{rows.map(([label, value]) => <ControlFact key={label} label={label} value={value} />)}</dl></details>;
}

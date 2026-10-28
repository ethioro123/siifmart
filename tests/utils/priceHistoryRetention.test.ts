import { describe,it,expect } from 'vitest';
import { priceHistorySince } from '../../utils/priceHistoryRetention';
describe('price history view window',()=>{
 it('defaults to twelve calendar months without changing timezone',()=>expect(priceHistorySince('12months',new Date('2026-10-28T12:00:00Z'))).toBe('2025-10-28T12:00:00.000Z'));
 it('keeps leap-year anniversaries in February',()=>expect(priceHistorySince('12months',new Date('2024-02-29T12:00:00Z'))).toBe('2023-02-28T12:00:00.000Z'));
 it('removes the date restriction for all retained history',()=>expect(priceHistorySince('all')).toBeNull());
});

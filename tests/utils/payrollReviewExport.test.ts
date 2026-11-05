import { expect, it } from 'vitest';
import { payrollReviewCsv } from '../../utils/payrollReviewExport';
it('exports only the approved snapshot as a review without fabricated payment recipients', () => {
 const csv = payrollReviewCsv({ runId: 'run', period: 'November 2026', country: 'ET', currency: 'ETB', gross: 100, bonus: 10, deductions: 5, net: 105, roster: [{ id: '11111111-1111-4111-8111-111111111111', salary: 100, site: '22222222-2222-4222-8222-222222222222' }] });
 expect(csv).toContain('Not a bank payment instruction'); expect(csv).toContain('"Approved net total","105"'); expect(csv).toContain('"Gross salary"');
 expect(csv).not.toContain('0911000000'); expect(csv).not.toContain('Phone Number');
});

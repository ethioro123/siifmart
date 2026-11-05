import type { PayrollReviewExport } from '../services/payroll-review-export.service';
const cell = (value: string | number) => '"' + String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
export function payrollReviewCsv(value: PayrollReviewExport): string {
    return [
        ['Payroll review only', 'Not a bank payment instruction'], ['Run', value.runId], ['Period', value.period], ['Currency', value.currency],
        ['Employee ID', 'Gross salary'], ...value.roster.map(row => [row.id, row.salary]),
        ['Total gross', value.gross], ['Proposed bonus total', value.bonus], ['Deduction total', value.deductions], ['Approved net total', value.net]
    ].map(row => row.map(cell).join(',')).join('\r\n');
}
export function downloadPayrollReview(value: PayrollReviewExport): string {
    const filename = `payroll_review_${value.country}_${value.runId.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    const url = URL.createObjectURL(new Blob([payrollReviewCsv(value)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    return filename;
}

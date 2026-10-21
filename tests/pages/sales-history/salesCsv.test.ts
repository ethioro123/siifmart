import { describe, expect, it } from 'vitest';
import { serializeSalesCsv } from '../../../pages/sales-history/utils/salesCsv';

describe('sales CSV export', () => {
    it('quotes delimiters and protects spreadsheet formula cells', () => {
        expect(serializeSalesCsv(['Receipt', 'Customer'], [['R-1', 'Smith, "Alex"'], ['R-2', '=HYPERLINK("x")']]))
            .toBe('\uFEFF"Receipt","Customer"\r\n"R-1","Smith, ""Alex"""\r\n"R-2","\'=HYPERLINK(""x"")"');
    });
});

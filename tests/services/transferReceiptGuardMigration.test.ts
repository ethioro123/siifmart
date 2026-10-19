import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('transfer receipt guard migration', () => {
    it('never indexes jsonb with a bigint ordinality (42883 jsonb -> bigint)', () => {
        const sql = readFileSync(
            join(__dirname, '../../migrations/20261019_fix_transfer_receipt_guard_jsonb_index_cast.sql'),
            'utf8'
        );
        expect(sql).not.toMatch(/->\s*\(m\.ordinality\s*-\s*1\)(?!::int)/);
        expect(sql).toContain('(m.ordinality - 1)::int');
    });
});

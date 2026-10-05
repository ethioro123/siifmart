import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Procurement Aesthetic and Architectural Compliance Audit', () => {
    const procurementDir = path.resolve(__dirname, '../../components/procurement');
    const procurementPagePath = path.resolve(__dirname, '../../pages/Procurement.tsx');

    const getProcurementFiles = (dir: string): string[] => {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(getProcurementFiles(filePath));
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(filePath);
            }
        });
        return results;
    };

    const allFiles = [...getProcurementFiles(procurementDir), procurementPagePath];

    it('enforces that all procurement files are strictly under 500 lines', () => {
        allFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n').length;
            const basename = path.basename(file);
            expect(lines, `${basename} has ${lines} lines, exceeding 500 lines limit`).toBeLessThanOrEqual(500);
        });
    });

    it('enforces zero emojis across all procurement components and pages', () => {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
        allFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                const match = emojiRegex.exec(line);
                const basename = path.basename(file);
                expect(match, `Found raw emoji in ${basename} at line ${index + 1}: ${line}`).toBeNull();
            });
        });
    });

    it('enforces zero legacy glass-panel and woody-btn classes', () => {
        const legacyClasses = ['glass-panel', 'glass-panel-pushed', 'glass-panel-hover', 'woody-btn-primary'];
        allFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            legacyClasses.forEach(cls => {
                expect(content.includes(cls), `Found legacy class "${cls}" in ${basename}`).toBe(false);
            });
        });
    });

    it('enforces zero hardcoded forest green or amber color hex codes in procurement code', () => {
        const forbiddenHexCodes = ['#2C5E3B', '#A9CBA2', '#8C6239', '#224429'];
        allFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const basename = path.basename(file);
            forbiddenHexCodes.forEach(hex => {
                expect(
                    content.toLowerCase().includes(hex.toLowerCase()),
                    `Found hardcoded forbidden color "${hex}" in ${basename}`
                ).toBe(false);
            });
        });
    });

    it('enforces semantic token usage for background, border, and text in main procurement components', () => {
        const mainFiles = [
            'SupplierManagement.tsx',
            'VendorRelationsTab.tsx',
            'CustomsImportTab.tsx',
            'InboundQCTab.tsx',
            'PurchaseOrdersList.tsx',
            'ViewPOModal.tsx'
        ];

        mainFiles.forEach(fileName => {
            const filePath = allFiles.find(f => path.basename(f) === fileName);
            expect(filePath, `Expected file ${fileName} to exist`).toBeDefined();
            if (filePath) {
                const content = fs.readFileSync(filePath, 'utf-8');
                expect(content).toContain('var(--theme-');
            }
        });
    });
});

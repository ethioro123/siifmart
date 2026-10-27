import { describe, it, expect } from 'vitest';
import { posCommand } from '../../../utils/translations/posCommand';

describe('POS Command Center - East Hararghe (Harargee Bahaa) Localization', () => {
    it('contains non-empty en, am, and or entries for all keys', () => {
        const keys = Object.keys(posCommand);
        expect(keys.length).toBeGreaterThan(60);

        const missingOr: string[] = [];
        const missingAm: string[] = [];
        const missingEn: string[] = [];

        keys.forEach((key) => {
            const entry = posCommand[key];
            if (!entry.or || entry.or.trim() === '') missingOr.push(key);
            if (!entry.am || entry.am.trim() === '') missingAm.push(key);
            if (!entry.en || entry.en.trim() === '') missingEn.push(key);
        });

        expect(missingOr, `Missing or translation for keys: ${missingOr.join(', ')}`).toHaveLength(0);
        expect(missingAm, `Missing am translation for keys: ${missingAm.join(', ')}`).toHaveLength(0);
        expect(missingEn, `Missing en translation for keys: ${missingEn.join(', ')}`).toHaveLength(0);
    });

    it('faithfully applies East Hararghe (Harargee Bahaa) dialect terminology', () => {
        // POS Command Center uses Wiirtuu Ajajaa
        expect(posCommand.title.or).toContain('Ajajaa POS');

        // Cash drawer uses Kaaza / Kaaza Qarshii
        expect(posCommand.drawerInactive.or.toLowerCase()).toContain('kaaza');
        expect(posCommand.drawerClosedBannerTitle.or.toLowerCase()).toContain('kaaza');
        expect(posCommand.drawerKicks.or.toLowerCase()).toContain('kaaza');
        expect(posCommand.openDrawerAndStart.or.toLowerCase()).toContain('kaaza');

        // Discrepancy & Variance uses Baqiyyaa (signature East Hararghe market word)
        expect(posCommand.thVariance.or.toLowerCase()).toBe('baqiyyaa');
        expect(posCommand.varianceReasonText.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.noVariance.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.filterFlaggedShifts.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.supervisorVarianceAuth.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.cashDiscrepancyTitle.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.discrepanciesDetected.or.toLowerCase()).toContain('baqiyyaa');
        expect(posCommand.discrepanciesReported.or.toLowerCase()).toContain('baqiyyaa');

        // Drop safe uses Saanduqa Eegumsaa
        expect(posCommand.safeLedgerLabel.or.toLowerCase()).toContain('saanduqa eegumsaa');
        expect(posCommand.safeLedgerTitle.or.toLowerCase()).toContain('saanduqa eegumsaa');
        expect(posCommand.totalInSafe.or.toLowerCase()).toContain('saanduqa eegumsaa');

        // Opening float uses Qarshii Ka'umsaa
        expect(posCommand.openingCashFloat.or.toLowerCase()).toContain("qarshii ka'umsaa");
        expect(posCommand.expectedFloatCash.or.toLowerCase()).toContain("qarshii ka'umsaa");

        // Receipt uses Nagahee
        expect(posCommand.reprintReceipt.or.toLowerCase()).toContain('nagahee');
        expect(posCommand.customerSaleReceipt.or.toLowerCase()).toContain('nagahee');
        expect(posCommand.receiptId.or.toLowerCase()).toContain('nagahee');

        // Sign-off / Confirm uses Mirkaneessi
        expect(posCommand.signOff.or.toLowerCase()).toContain('mirkaneessi');
        expect(posCommand.signOffAndFinalize.or.toLowerCase()).toContain('mirkaneessi');
        expect(posCommand.authorizeWithManagerPin.or.toLowerCase()).toContain('mirkaneessi');

        // Shift uses Shifii
        expect(posCommand.startShift.or.toLowerCase()).toContain('shifii');
        expect(posCommand.endShift.or.toLowerCase()).toContain('shifii');
        expect(posCommand.shiftTarget.or.toLowerCase()).toContain('shifii');

        // Counter uses Kaawuntarii
        expect(posCommand.thCashierCounter.or.toLowerCase()).toContain('kaawuntarii');
        expect(posCommand.assignRegisterCounter.or.toLowerCase()).toContain('kaawuntarii');
    });

    it('provides valid parameterized translation templates', () => {
        expect(posCommand.targetCount.en).toContain('{count}');
        expect(posCommand.targetCount.am).toContain('{count}');
        expect(posCommand.targetCount.or).toContain('{count}');

        expect(posCommand.processedCount.en).toContain('{count}');
        expect(posCommand.processedCount.am).toContain('{count}');
        expect(posCommand.processedCount.or).toContain('{count}');

        expect(posCommand.openCounterAndStart.en).toContain('{counter}');
        expect(posCommand.openCounterAndStart.am).toContain('{counter}');
        expect(posCommand.openCounterAndStart.or).toContain('{counter}');

        expect(posCommand.productsUpdatedRecently.en).toContain('{count}');
        expect(posCommand.productsUpdatedRecently.am).toContain('{count}');
        expect(posCommand.productsUpdatedRecently.or).toContain('{count}');
    });
});

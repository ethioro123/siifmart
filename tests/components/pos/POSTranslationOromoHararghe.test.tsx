// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '../../../utils/translations';
import { pos } from '../../../utils/translations/pos';

describe('POS Operations East Hararghe (Harargee Bahaa) Oromo Localization', () => {
    it('ensures all POS keys are defined for en, am, and or without blanks', () => {
        const missingTranslations: string[] = [];
        
        for (const [key, rawVal] of Object.entries(pos)) {
            const val = rawVal as { en?: string; am?: string; or?: string };
            if (!val.en || typeof val.en !== 'string' || val.en.trim() === '') {
                missingTranslations.push(`Key "${key}" missing English (en)`);
            }
            if (!val.am || typeof val.am !== 'string' || val.am.trim() === '') {
                missingTranslations.push(`Key "${key}" missing Amharic (am)`);
            }
            if (!val.or || typeof val.or !== 'string' || val.or.trim() === '') {
                missingTranslations.push(`Key "${key}" missing East Hararghe Oromo (or)`);
            }
        }

        expect(missingTranslations).toEqual([]);
        expect(Object.keys(pos).length).toBeGreaterThanOrEqual(100);
    });

    it('uses authentic East Hararghe market terminology for Change Due (Baqiyyaa)', () => {
        // In Dire Dawa, Harar, Aweday, and Babille markets, change returned is "Baqiyyaa"
        expect(pos.changeDue.or).toContain('Baqiyyaa');
        expect(String(pos.changeDue.or).toLowerCase()).toContain('baqiyyaa');
    });

    it('uses authentic East Hararghe market terminology for Cash Drawer/Tray (Kaaza Qarshii)', () => {
        // Hararghe commercial cash till/drawer is referred to as "Kaaza" / "Kaaza qarshii"
        expect(pos.cashTray.or).toBe('Kaaza Qarshii');
        expect(pos.openDrawer.or).toContain('Kaaza');
        expect(pos.drawer.or).toContain('Kaaza');
        expect(pos.cashInDrawer.or).toContain('Kaaza');
    });

    it('uses authentic Hararghe commercial terms for Cart (Kaartii)', () => {
        // Cart in East Hararghe retail is "Kaartii"
        expect(pos.cart.or).toBe('Kaartii');
        expect(pos.clearCart.or).toContain('Kaartii');
        expect(pos.cartEmpty.or).toContain('Kaartii');
        expect(pos.holdCart.or).toContain('Kaartii');
        expect(pos.cartSubtotal.or).toContain('Kaartii');
        expect(pos.cartOverwriteWarning.or).toContain('kaartii');
        expect(pos.viewCart.or).toContain('Kaartii');
    });

    it('uses authentic Hararghe commercial terms for Discount (Hifsa / Hir\'ifama)', () => {
        // Discount in Harar/Dire Dawa markets is "Hifsa" or "Hir'ifama"
        expect(pos.discount.or).toMatch(/Hifsa|Hir'ifama/);
        expect(pos.applyDiscount.or).toContain('Hir\'ifama');
        expect(pos.applyDiscountCode.or).toContain('Hir\'ifama');
        expect(pos.zeroTrustPromotionDesc.or).toMatch(/Hifsa|hir'ifama/i);
    });

    it('uses authentic Hararghe commercial terms for Receipt (Nagahee)', () => {
        expect(pos.receipt.or).toBe('Nagahee');
        expect(pos.printReceipt.or).toContain('Nagahee');
        expect(pos.emailReceipt.or).toContain('Nagahee');
        expect(pos.receiptReference.or).toContain('Nagahee');
        expect(pos.reprintReceipt.or).toContain('Nagahee');
        expect(pos.scanReceiptOrEnter.or).toContain('nagahee');
    });

    it('uses authentic Hararghe commercial terms for Hold and Recall (Tursi / Tursiifame)', () => {
        expect(pos.hold.or).toContain('TURSI');
        expect(pos.holdOrder.or).toContain('Tursi');
        expect(pos.orderHeld.or).toContain('Tursi');
        expect(pos.recallHeld.or).toContain('Tursi');
        expect(pos.recallOrder.or).toContain('Tursi');
    });

    it('uses authentic Hararghe commercial terms for Charge/Pay (Kaffalchiisi / Amma Kaffal)', () => {
        expect(pos.payNow.or).toContain('Kaffal');
        expect(pos.charge.or).toBe('Kaffalchiisi');
        expect(pos.totalAmountDue.or).toContain('Kaffalamu');
    });

    it('uses authentic Hararghe commercial terms for Store (Suuqii)', () => {
        // Store in Harar / Dire Dawa / Somali-adjacent Oromo is "Suuqii"
        expect(pos.selectStore.or).toContain('Suuqii');
        expect(pos.fullHistoryForStore.or).toContain('suuqii');
        expect(pos.noPurchaseHistory.or).toContain('suuqii');
    });

    it('uses authentic Hararghe commercial terms for Verification (Mirkaneessi / Mirkanaa\'eera)', () => {
        expect(pos.verifyShift.or).toContain('Mirkaneessi');
        expect(pos.paymentSuccess.or).toContain('Mirkanaa\'eera');
        expect(pos.transactionVerified.or).toContain('mirkanaa\'eera');
        expect(pos.review.or).toContain('Mirkaneessi');
        expect(pos.reviewed.or).toContain('Mirkanaa\'eera');
    });

    it('interpolates parameters correctly with East Hararghe strings', () => {
        const uploadTemplate = String(pos.uploadingQueuedTransactions.or);
        const formattedUpload = uploadTemplate.replace('{count}', '7');
        expect(formattedUpload).toBe('Gurgurtaalee 7 gara sararaatti olfe\'aa jira...');

        const priceHistoryTemplate = String(pos.unreviewedInLast7Days.or);
        const formattedPrice = priceHistoryTemplate.replace('{count}', '4');
        expect(formattedPrice).toBe('Guyyoota 7 darban keessatti 4 hin mirkanoofne');

        const voidTemplate = String(pos.voidWarning.or);
        const formattedVoid = voidTemplate.replace('{count}', '3').replace('{amount}', 'ETB 1,200');
        expect(formattedVoid).toContain('3');
        expect(formattedVoid).toContain('ETB 1,200');
    });
});

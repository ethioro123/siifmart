import { describe, it, expect } from 'vitest';
import { resolveCountAndPackPolicy } from '../../utils/receivingPolicy';
import { HealthSettingsSchema, OutboundSettingsSchema } from '../../schemas/wms-settings.schema';
import { ALLOWED_FIELDS } from '../../hooks/useWMSSettingsMutation';
import type { SystemConfig } from '../../types';

describe('Zero-Trust Blind Cycle-Count & Pack Security Policies', () => {
    describe('resolveCountAndPackPolicy', () => {
        it('provides secure zero-trust defaults when settings are undefined', () => {
            const policy = resolveCountAndPackPolicy(undefined);
            expect(policy.maxCycleCountRecounts).toBe(1);
            expect(policy.requireSecondCounterOnVariance).toBe(true);
            expect(policy.requirePackSecuritySeal).toBe(true);
            expect(policy.requirePackCartonWeight).toBe(false);
            expect(policy.packWeightTolerancePct).toBe(5);
        });

        it('isolates country configuration partitions without cross-border bleed (Rule 7)', () => {
            const mockConfig: Partial<SystemConfig> = {
                country: 'ET',
                maxCycleCountRecounts: 1,
                requireSecondCounterOnVariance: true,
                requirePackSecuritySeal: true,
                requirePackCartonWeight: false,
                packWeightTolerancePct: 5,
                countryConfigs: {
                    ET: {
                        maxCycleCountRecounts: 2,
                        requireSecondCounterOnVariance: true,
                        requirePackSecuritySeal: true,
                        requirePackCartonWeight: true,
                        packWeightTolerancePct: 3,
                    },
                    KE: {
                        maxCycleCountRecounts: 0,
                        requireSecondCounterOnVariance: false,
                        requirePackSecuritySeal: false,
                        requirePackCartonWeight: false,
                        packWeightTolerancePct: 10,
                    },
                } as any,
            };

            const etPolicy = resolveCountAndPackPolicy(mockConfig, 'ET');
            expect(etPolicy.maxCycleCountRecounts).toBe(2);
            expect(etPolicy.requireSecondCounterOnVariance).toBe(true);
            expect(etPolicy.requirePackSecuritySeal).toBe(true);
            expect(etPolicy.requirePackCartonWeight).toBe(true);
            expect(etPolicy.packWeightTolerancePct).toBe(3);

            const kePolicy = resolveCountAndPackPolicy(mockConfig, 'KE');
            expect(kePolicy.maxCycleCountRecounts).toBe(0);
            expect(kePolicy.requireSecondCounterOnVariance).toBe(false);
            expect(kePolicy.requirePackSecuritySeal).toBe(false);
            expect(kePolicy.requirePackCartonWeight).toBe(false);
            expect(kePolicy.packWeightTolerancePct).toBe(10);
        });

        it('falls back to root settings when country partition does not set explicit overrides', () => {
            const mockConfig: Partial<SystemConfig> = {
                country: 'ET',
                maxCycleCountRecounts: 3,
                requireSecondCounterOnVariance: true,
                requirePackSecuritySeal: false,
                requirePackCartonWeight: true,
                packWeightTolerancePct: 4,
                countryConfigs: {
                    ET: {},
                } as any,
            };

            const policy = resolveCountAndPackPolicy(mockConfig, 'ET');
            expect(policy.maxCycleCountRecounts).toBe(3);
            expect(policy.requirePackSecuritySeal).toBe(false);
            expect(policy.requirePackCartonWeight).toBe(true);
            expect(policy.packWeightTolerancePct).toBe(4);
        });
    });

    describe('WMS Settings Schemas & Mutation Allowlist', () => {
        it('validates HealthSettingsSchema with recount and second-counter fields', () => {
            const valid = HealthSettingsSchema.safeParse({
                rotationPolicy: 'fefo',
                requireExpiry: true,
                cycleCountStrategy: 'abc',
                maxCycleCountRecounts: 2,
                requireSecondCounterOnVariance: true,
            });
            expect(valid.success).toBe(true);
            if (valid.success) {
                expect(valid.data.maxCycleCountRecounts).toBe(2);
                expect(valid.data.requireSecondCounterOnVariance).toBe(true);
            }
        });

        it('validates OutboundSettingsSchema with security seal and scale weight fields', () => {
            const valid = OutboundSettingsSchema.safeParse({
                pickingMethod: 'order',
                strictScanning: true,
                bayScan: false,
                requirePackSecuritySeal: true,
                requirePackCartonWeight: true,
                packWeightTolerancePct: 4.5,
            });
            expect(valid.success).toBe(true);
            if (valid.success) {
                expect(valid.data.requirePackSecuritySeal).toBe(true);
                expect(valid.data.requirePackCartonWeight).toBe(true);
                expect(valid.data.packWeightTolerancePct).toBe(4.5);
            }
        });

        it('includes newly introduced fields in ALLOWED_FIELDS', () => {
            expect(ALLOWED_FIELDS.health).toContain('maxCycleCountRecounts');
            expect(ALLOWED_FIELDS.health).toContain('requireSecondCounterOnVariance');
            expect(ALLOWED_FIELDS.outbound).toContain('requirePackSecuritySeal');
            expect(ALLOWED_FIELDS.outbound).toContain('requirePackCartonWeight');
            expect(ALLOWED_FIELDS.outbound).toContain('packWeightTolerancePct');
        });
    });

    describe('Scale Weight Tolerance & Security Seal Logic', () => {
        it('computes scale weight variance percentage correctly', () => {
            const expectedWeightKg = 10.0;
            const actualWeightKg = 10.4;
            const diffKg = Math.abs(actualWeightKg - expectedWeightKg);
            const variancePct = (diffKg / expectedWeightKg) * 100;

            expect(diffKg).toBeCloseTo(0.4);
            expect(variancePct).toBeCloseTo(4.0);

            const tolerancePct = 5.0;
            const isWithinTolerance = variancePct <= tolerancePct;
            expect(isWithinTolerance).toBe(true);
        });

        it('flags weight variance when exceeding configured tolerance', () => {
            const expectedWeightKg = 5.0;
            const actualWeightKg = 5.4; // 8% over
            const variancePct = ((Math.abs(actualWeightKg - expectedWeightKg)) / expectedWeightKg) * 100;

            expect(variancePct).toBeCloseTo(8.0);
            const tolerancePct = 5.0;
            expect(variancePct <= tolerancePct).toBe(false);
        });

        it('validates security seal serial requirement when tamper tape is selected', () => {
            const requiresSeal = true;
            const packagingType = 'box_medium';
            const tapeType = 'tamper_evident';
            const sealSerialNumber = '';

            const isBlocked = requiresSeal && tapeType === 'tamper_evident' && !sealSerialNumber.trim();
            expect(isBlocked).toBe(true);

            const validSealNumber = 'SEAL-2026-ET-9842';
            const isNowValid = !(requiresSeal && tapeType === 'tamper_evident' && !validSealNumber.trim());
            expect(isNowValid).toBe(true);
        });
    });
});

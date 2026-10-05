import { describe, it, expect } from 'vitest';
import {
    resolveFulfillmentScanningPolicy,
    resolveReceivingPolicy
} from '../../utils/receivingPolicy';
import { InboundSettingsSchema, OutboundSettingsSchema } from '../../schemas/wms-settings.schema';
import { ALLOWED_FIELDS } from '../../hooks/useWMSSettingsMutation';
import type { SystemConfig } from '../../types';

describe('Zero-Trust Fulfillment Quantity Entry & Blind Receiving Policy', () => {
    describe('resolveFulfillmentScanningPolicy', () => {
        it('defaults to true (Zero-Trust explicit quantity entry) when settings are undefined', () => {
            const policy = resolveFulfillmentScanningPolicy(undefined);
            expect(policy.requirePutawayQuantityEntry).toBe(true);
            expect(policy.requirePickQuantityEntry).toBe(true);
        });

        it('isolates country configuration partitions without cross-border bleed', () => {
            const mockConfig: Partial<SystemConfig> = {
                country: 'ET',
                requirePutawayQuantityEntry: true,
                requirePickQuantityEntry: true,
                countryConfigs: {
                    ET: {
                        requirePutawayQuantityEntry: true,
                        requirePickQuantityEntry: true
                    },
                    KE: {
                        requirePutawayQuantityEntry: false,
                        requirePickQuantityEntry: false
                    }
                } as any
            };

            const etPolicy = resolveFulfillmentScanningPolicy(mockConfig, 'ET');
            expect(etPolicy.requirePutawayQuantityEntry).toBe(true);
            expect(etPolicy.requirePickQuantityEntry).toBe(true);

            const kePolicy = resolveFulfillmentScanningPolicy(mockConfig, 'KE');
            expect(kePolicy.requirePutawayQuantityEntry).toBe(false);
            expect(kePolicy.requirePickQuantityEntry).toBe(false);
        });

        it('falls back to root settings if country partition does not define the override', () => {
            const mockConfig: Partial<SystemConfig> = {
                country: 'ET',
                requirePutawayQuantityEntry: false,
                requirePickQuantityEntry: false,
                countryConfigs: {
                    ET: {}
                } as any
            };

            const etPolicy = resolveFulfillmentScanningPolicy(mockConfig, 'ET');
            expect(etPolicy.requirePutawayQuantityEntry).toBe(false);
            expect(etPolicy.requirePickQuantityEntry).toBe(false);
        });
    });

    describe('resolveReceivingPolicy', () => {
        it('correctly resolves blind receiving state across country partitions', () => {
            const mockConfig: Partial<SystemConfig> = {
                country: 'ET',
                countryConfigs: {
                    ET: { receivingLogic: 'blind', overReceiveTolerancePct: 0 },
                    KE: { receivingLogic: 'verified', overReceiveTolerancePct: 5 }
                } as any
            };

            const etPolicy = resolveReceivingPolicy(mockConfig, 'ET');
            expect(etPolicy.blind).toBe(true);

            const kePolicy = resolveReceivingPolicy(mockConfig, 'KE');
            expect(kePolicy.blind).toBe(false);
        });
    });

    describe('WMS Settings Zod Schema Validation', () => {
        it('validates requirePutawayQuantityEntry in InboundSettingsSchema', () => {
            const parsedValid = InboundSettingsSchema.safeParse({
                receivingLogic: 'blind',
                qcSamplingRate: 10,
                qcBlockOnFailure: true,
                putawayLogic: 'system',
                requirePutawayQuantityEntry: true
            });
            expect(parsedValid.success).toBe(true);

            const parsedInvalid = InboundSettingsSchema.safeParse({
                receivingLogic: 'blind',
                qcSamplingRate: 10,
                qcBlockOnFailure: true,
                putawayLogic: 'system',
                requirePutawayQuantityEntry: 'not-a-boolean'
            });
            expect(parsedInvalid.success).toBe(false);
        });

        it('validates requirePickQuantityEntry in OutboundSettingsSchema', () => {
            const parsedValid = OutboundSettingsSchema.safeParse({
                pickingMethod: 'order',
                strictScanning: true,
                bayScan: true,
                requirePickQuantityEntry: false
            });
            expect(parsedValid.success).toBe(true);

            const parsedInvalid = OutboundSettingsSchema.safeParse({
                pickingMethod: 'order',
                strictScanning: true,
                bayScan: true,
                requirePickQuantityEntry: 123
            });
            expect(parsedInvalid.success).toBe(false);
        });
    });

    describe('Mutation Allowlist & DB Column Mapping', () => {
        it('includes requirePutawayQuantityEntry in inbound mutation allowlist', () => {
            expect(ALLOWED_FIELDS.inbound).toContain('requirePutawayQuantityEntry');
        });

        it('includes requirePickQuantityEntry in outbound mutation allowlist', () => {
            expect(ALLOWED_FIELDS.outbound).toContain('requirePickQuantityEntry');
        });
    });
});

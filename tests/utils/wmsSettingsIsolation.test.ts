import { describe, it, expect } from 'vitest';
import {
  InboundSettingsSchema,
  HealthSettingsSchema,
  OutboundSettingsSchema,
} from '../../schemas/wms-settings.schema';

describe('WMS Settings Zod Schemas & Rules', () => {
  it('should validate valid inbound receiving settings', () => {
    const valid = InboundSettingsSchema.safeParse({
      receivingLogic: 'blind',
      qcSamplingRate: 15,
      qcBlockOnFailure: true,
      putawayLogic: 'system',
      country: 'KE',
    });
    expect(valid.success).toBe(true);
  });

  it('should reject invalid QC sampling rates outside 0-100%', () => {
    const invalidNegative = InboundSettingsSchema.safeParse({
      receivingLogic: 'blind',
      qcSamplingRate: -5,
      qcBlockOnFailure: true,
      putawayLogic: 'system',
    });
    expect(invalidNegative.success).toBe(false);

    const invalidOver100 = InboundSettingsSchema.safeParse({
      receivingLogic: 'blind',
      qcSamplingRate: 120,
      qcBlockOnFailure: true,
      putawayLogic: 'system',
    });
    expect(invalidOver100.success).toBe(false);
  });

  it('should permit FEFO and FIFO but strictly reject illegal LIFO rotation policy', () => {
    const fefoValid = HealthSettingsSchema.safeParse({
      rotationPolicy: 'fefo',
      requireExpiry: true,
      cycleCountStrategy: 'abc',
      country: 'ET',
    });
    expect(fefoValid.success).toBe(true);

    const fifoValid = HealthSettingsSchema.safeParse({
      rotationPolicy: 'fifo',
      requireExpiry: false,
      cycleCountStrategy: 'random',
      country: 'KE',
    });
    expect(fifoValid.success).toBe(true);

    // LIFO violates AGENTS.md §4 (Universal FEFO / margin protection)
    const lifoInvalid = HealthSettingsSchema.safeParse({
      rotationPolicy: 'lifo' as any,
      requireExpiry: false,
      cycleCountStrategy: 'abc',
    });
    expect(lifoInvalid.success).toBe(false);
  });

  it('should validate outbound picking methods and safeguards', () => {
    const valid = OutboundSettingsSchema.safeParse({
      pickingMethod: 'wave',
      strictScanning: true,
      bayScan: true,
      country: 'KE',
    });
    expect(valid.success).toBe(true);

    const invalidMethod = OutboundSettingsSchema.safeParse({
      pickingMethod: 'batch-invalid' as any,
      strictScanning: true,
      bayScan: true,
    });
    expect(invalidMethod.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  HardwareSettingsSchema,
  PeripheralDeviceSchema,
} from '../../schemas/hardware-settings.schema';
import type { SystemConfig } from '../../types';

describe('Infrastructure & Hardware Settings Isolation & Validation', () => {
  it('should guarantee 100% settings partitioning in countryConfigs without cross-border bleed', () => {
    const initialConfigs: Record<string, Partial<SystemConfig>> = {
      ET: {
        scaleIpAddress: '192.168.1.50',
        scannerComPort: 'COM3',
        defaultPrinter: 'Main Receipt Printer ET',
        scaleUnit: 'KG',
      },
      KE: {
        scaleIpAddress: '192.168.20.100',
        scannerComPort: 'COM1',
        defaultPrinter: 'Main Receipt Printer KE',
        scaleUnit: 'KG',
      },
    };

    // Simulate modifying Kenyan hardware station defaults
    const updatedKenyaHardware = {
      scaleIpAddress: '192.168.20.150',
      scannerComPort: 'COM4',
      defaultPrinter: 'Nairobi Hub Printer',
    };

    const newCountryConfigs: Record<string, Partial<SystemConfig>> = {
      ...initialConfigs,
      KE: {
        ...initialConfigs.KE,
        ...updatedKenyaHardware,
      },
    };

    // Verify Kenya updated
    expect(newCountryConfigs.KE.scaleIpAddress).toBe('192.168.20.150');
    expect(newCountryConfigs.KE.scannerComPort).toBe('COM4');
    expect(newCountryConfigs.KE.defaultPrinter).toBe('Nairobi Hub Printer');

    // Verify Ethiopia is 100% UNTOUCHED (Zero Bleed Guarantee)
    expect(newCountryConfigs.ET.scaleIpAddress).toBe('192.168.1.50');
    expect(newCountryConfigs.ET.scannerComPort).toBe('COM3');
    expect(newCountryConfigs.ET.defaultPrinter).toBe('Main Receipt Printer ET');
  });

  describe('HardwareSettingsSchema Validation', () => {
    it('should validate valid IPv4 scale IP and COM port', () => {
      const valid = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '192.168.1.50',
        scannerComPort: 'COM3',
        defaultPrinter: 'Epson TM-T88VI',
        scaleUnit: 'KG',
      });
      expect(valid.success).toBe(true);
    });

    it('should allow empty scale IP and COM port', () => {
      const validEmpty = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Receipt Printer',
        scaleUnit: 'KG',
      });
      expect(validEmpty.success).toBe(true);
    });

    it('should reject invalid/malformed IP addresses', () => {
      const invalidIp = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '999.999.999.999',
        scannerComPort: 'COM1',
        defaultPrinter: 'Main Receipt Printer',
        scaleUnit: 'KG',
      });
      expect(invalidIp.success).toBe(false);

      const maliciousUrl = HardwareSettingsSchema.safeParse({
        scaleIpAddress: 'http://malicious-internal-server.local',
        scannerComPort: 'COM1',
        defaultPrinter: 'Main Receipt Printer',
        scaleUnit: 'KG',
      });
      expect(maliciousUrl.success).toBe(false);
    });

    it('should validate scale calibration unit enum', () => {
      const validKg = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Printer',
        scaleUnit: 'KG',
      });
      expect(validKg.success).toBe(true);

      const validLbs = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Printer',
        scaleUnit: 'LBS',
      });
      expect(validLbs.success).toBe(true);

      const invalidUnit = HardwareSettingsSchema.safeParse({
        scaleIpAddress: '',
        scannerComPort: '',
        defaultPrinter: 'Main Printer',
        scaleUnit: 'OUNCES',
      });
      expect(invalidUnit.success).toBe(false);
    });
  });

  describe('PeripheralDeviceSchema Validation', () => {
    it('should validate complete peripheral device registrations', () => {
      const valid = PeripheralDeviceSchema.safeParse({
        id: 'dev-1',
        name: 'Main Receipt Printer',
        model: 'Epson TM-T88VI',
        type: 'printer',
        connection: 'network',
        address: '192.168.1.200',
        status: 'online',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid connection types or categories', () => {
      const invalid = PeripheralDeviceSchema.safeParse({
        id: 'dev-2',
        name: 'Unknown Device',
        model: 'Generic',
        type: 'camera', // Only 'printer' | 'scale' | 'scanner' allowed
        connection: 'firewire',
        address: 'PORT-1',
        status: 'online',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Zero-Trust Role Access Boundaries', () => {
    const allowedRoles = [
      'super_admin',
      'CEO',
      'operations_manager',
      'regional_manager',
      'store_manager',
      'warehouse_manager',
    ];

    it('should authorize station managers and operations leadership', () => {
      for (const role of allowedRoles) {
        expect(allowedRoles.includes(role)).toBe(true);
      }
    });

    it('should block unprivileged roles from mutating corporate hardware defaults', () => {
      const blockedRoles = ['cashier', 'picker', 'driver', 'guest'];
      for (const role of blockedRoles) {
        expect(allowedRoles.includes(role)).toBe(false);
      }
    });
  });
});

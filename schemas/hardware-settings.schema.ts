import { z } from 'zod';

export const ScaleIpRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^localhost$|^$/;
export const ComPortRegex = /^(?:COM[0-9]{1,3}|\/dev\/tty[a-zA-Z0-9._-]+|USB[0-9]*|BT-[A-Za-z0-9:-]+)$|^$/i;

export const HardwareSettingsSchema = z.object({
  scaleIpAddress: z
    .string()
    .trim()
    .regex(ScaleIpRegex, 'Scale IP must be a valid IPv4 address (e.g. 192.168.1.50) or empty')
    .optional()
    .or(z.literal('')),
  scannerComPort: z
    .string()
    .trim()
    .regex(ComPortRegex, 'Scanner port must be a valid COM port (e.g. COM3) or USB/TTY path')
    .optional()
    .or(z.literal('')),
  defaultPrinter: z
    .string()
    .trim()
    .min(1, 'Default printer name is required')
    .max(100, 'Printer name cannot exceed 100 characters'),
  scaleUnit: z.enum(['KG', 'LBS'] as const, {
    message: 'Scale unit must be either KG (Metric) or LBS (Imperial)',
  }),
});

export const PeripheralDeviceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().trim().min(1, 'Device name is required').max(80),
  model: z.string().trim().min(1, 'Model is required').max(80),
  type: z.enum(['printer', 'scale', 'scanner'] as const),
  connection: z.enum(['network', 'usb', 'bluetooth'] as const),
  address: z.string().trim().min(1, 'Address / Port is required').max(100),
  status: z.enum(['online', 'offline'] as const),
});

export type HardwareSettingsInput = z.infer<typeof HardwareSettingsSchema>;
export type PeripheralDeviceInput = z.infer<typeof PeripheralDeviceSchema>;

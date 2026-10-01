import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logisticsZonesService } from '../../services/logisticsZones.service';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('logisticsZonesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('scopes query to active country when KE is specified', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [{ id: 'z-ke-1', name: 'Nairobi Metro Zone', country: 'KE' }],
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const zones = await logisticsZonesService.getAll('KE');
      expect(supabase.from).toHaveBeenCalledWith('logistics_zones');
      expect(mockOrder).toHaveBeenCalledWith('name', { ascending: true });
      expect(mockEq).toHaveBeenCalledWith('country', 'KE');
      expect(zones).toHaveLength(1);
      expect(zones[0].name).toBe('Nairobi Metro Zone');
    });

    it('scopes query to ET and legacy null records when ET is specified', async () => {
      const mockOr = vi.fn().mockResolvedValue({
        data: [{ id: 'z-et-1', name: 'Addis Ababa Zone', country: 'ET' }],
        error: null,
      });
      const mockOrder = vi.fn().mockReturnValue({
        or: mockOr,
      });
      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const zones = await logisticsZonesService.getAll('ET');
      expect(mockOr).toHaveBeenCalledWith('country.eq.ET,country.is.null');
      expect(zones).toHaveLength(1);
      expect(zones[0].name).toBe('Addis Ababa Zone');
    });
  });

  describe('create', () => {
    it('creates a new zone with specified country payload', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'z-new-1', name: 'Mombasa Coastal Zone', description: 'Port hub', country: 'KE' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const created = await logisticsZonesService.create({
        name: 'Mombasa Coastal Zone',
        description: 'Port hub',
        country: 'KE',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Mombasa Coastal Zone',
        description: 'Port hub',
        country: 'KE',
      });
      expect(created.id).toBe('z-new-1');
    });
  });

  describe('update', () => {
    it('updates zone with explicit allowlist fields', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'z-1', name: 'Updated Zone', description: 'Updated Desc' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const updated = await logisticsZonesService.update('z-1', {
        name: 'Updated Zone',
        description: 'Updated Desc',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Zone',
          description: 'Updated Desc',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'z-1');
      expect(updated.name).toBe('Updated Zone');
    });
  });

  describe('delete', () => {
    it('deletes zone by id', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      await logisticsZonesService.delete('z-del-1');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'z-del-1');
    });
  });
});

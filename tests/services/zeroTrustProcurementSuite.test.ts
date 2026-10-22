import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchaseOrdersApprovalService } from '../../services/purchase-orders.approval';
import { suppliersService } from '../../services/suppliers.service';
import { procurementGovernanceService } from '../../services/procurement-governance.service';
import * as poReadModule from '../../services/purchase-orders.read';
import { supabase } from '../../lib/supabase';

describe('Zero-Trust Procurement & 4-Eyes Governance Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4-Eyes PO Approval Governance', () => {
    it('strictly blocks self-approval when approver is the PO creator', async () => {
      vi.spyOn(poReadModule, 'getById').mockResolvedValueOnce({
        id: 'po-101',
        poNumber: 'ETPO0001',
        status: 'Pending',
        totalAmount: 5000,
        currency: 'ETB',
        createdBy: 'Dawit Sourcing',
        requestedBy: 'Dawit Sourcing',
        lineItems: []
      } as any);

      await expect(
        purchaseOrdersApprovalService.approve({
          poId: 'po-101',
          approverId: 'EMP-01',
          approverName: 'Dawit Sourcing',
          approverRole: 'country_commercial_director',
          reasonCode: 'STANDARD_REPLENISHMENT'
        })
      ).rejects.toThrow(/Zero-Trust 4-Eyes Violation: Self-approval is strictly prohibited/);
    });

    it('strictly blocks warehouse managers from approving purchase orders (SoD Violation)', async () => {
      vi.spyOn(poReadModule, 'getById').mockResolvedValueOnce({
        id: 'po-102',
        poNumber: 'ETPO0002',
        status: 'Pending',
        totalAmount: 15000,
        currency: 'ETB',
        createdBy: 'Abebe Buyer',
        lineItems: []
      } as any);

      await expect(
        purchaseOrdersApprovalService.approve({
          poId: 'po-102',
          approverId: 'WM-01',
          approverName: 'Kebede Warehouse',
          approverRole: 'warehouse_manager',
          reasonCode: 'STANDARD_REPLENISHMENT'
        })
      ).rejects.toThrow(/Purchase order approval requires a procurement lead/);
    });

    it('mandates structured reason codes on PO approval', async () => {
      vi.spyOn(poReadModule, 'getById').mockResolvedValueOnce({
        id: 'po-103',
        poNumber: 'ETPO0003',
        status: 'Pending',
        totalAmount: 20000,
        currency: 'ETB',
        createdBy: 'Abebe Buyer',
        lineItems: []
      } as any);

      await expect(
        purchaseOrdersApprovalService.approve({
          poId: 'po-103',
          approverId: 'PM-01',
          approverName: 'Sara Manager',
          approverRole: 'country_commercial_director',
          reasonCode: '' as any
        })
      ).rejects.toThrow(/Structured reason code is mandatory for PO approval/);
    });

    it('mandates structured reason codes on PO rejection', async () => {
      vi.spyOn(poReadModule, 'getById').mockResolvedValueOnce({
        id: 'po-104',
        poNumber: 'ETPO0004',
        status: 'Pending',
        totalAmount: 20000,
        currency: 'ETB',
        createdBy: 'Abebe Buyer',
        lineItems: []
      } as any);

      await expect(
        purchaseOrdersApprovalService.reject({
          poId: 'po-104',
          rejectorId: 'PM-01',
          rejectorName: 'Sara Manager',
          rejectorRole: 'country_commercial_director',
          reasonCode: '' as any
        })
      ).rejects.toThrow(/Structured reason code is mandatory for PO rejection/);
    });
  });

  describe('Multi-Country Supplier Isolation & Duplicate Prevention', () => {
    it('scopes supplier retrieval by country code to eliminate cross-border leakage', async () => {
      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              { id: 'sup-1', name: 'Nairobi Millers', country_code: 'KE', lead_time: 3 }
            ],
            count: 1,
            error: null
          })
        })
      });

      const eqSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: [
              { id: 'sup-1', name: 'Nairobi Millers', country_code: 'KE', lead_time: 3 }
            ],
            count: 1,
            error: null
          })
        })
      });

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqSpy
        })
      } as any);

      const res = await suppliersService.getAll(50, 0, 'KE');
      expect(res.data.length).toBe(1);
      expect(res.data[0].countryCode).toBe('KE');
      expect(eqSpy).toHaveBeenCalledWith('country_code', 'KE');
    });

    it('blocks registering duplicate Tax ID / TIN under the same country', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'sup-old', name: 'Existing Harar Farm' }
              })
            })
          })
        })
      } as any);

      await expect(
        suppliersService.create({
          name: 'New Duplicate Farm',
          type: 'Business',
          contact: 'Test',
          category: 'Produce',
          status: 'Active',
          rating: 5,
          leadTime: 2,
          taxId: 'TIN-00998811',
          countryCode: 'ET'
        })
      ).rejects.toThrow(/Zero-Trust Vendor Guard: Tax ID \/ TIN "TIN-00998811" is already registered/);
    });
  });

  describe('Inbound QC Dock & Cold-Chain Food Safety Enforcement', () => {
    it('records cold chain compliance and creates QC record via service', async () => {
      const insertSpy = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'qc-01', po_number: 'KEPO001', disposition: 'Accepted' },
            error: null
          })
        })
      });

      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: insertSpy
      } as any);

      const qc = await procurementGovernanceService.createInboundQCInspection({
        poNumber: 'KEPO001',
        countryCode: 'KE',
        inspectorId: 'QC-1',
        inspectorName: 'Juma Inspector',
        inspectorRole: 'inbound_qc_inspector',
        inspectionDate: '2026-10-04T12:00:00Z',
        sampleSize: 15,
        coldChainTempCelsius: 3.2,
        tempComplianceStatus: 'Compliant',
        packagingIntegrity: 'Passed',
        expiryCheck: 'Passed',
        foodSafetyPassed: true,
        discrepancyFound: false,
        disposition: 'Accepted'
      });

      expect(qc).toBeDefined();
      expect(insertSpy).toHaveBeenCalled();
    });
  });
});

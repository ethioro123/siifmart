import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  VendorScorecard,
  VendorContract,
  FarmerProgram,
  CustomsDeclaration,
  InboundQCInspection
} from '../types/procurement-zero-trust';

export const procurementGovernanceService = {
  // ==========================================
  // VENDOR RELATIONS: SCORECARDS
  // ==========================================
  async getScorecards(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_scorecards')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('ProcurementGovernance', 'Could not query vendor_scorecards', { error: String(error.message) });
        return [];
      }
      return (data || []).map((s: any) => ({
        id: s.id,
        supplierId: s.supplier_id,
        countryCode: s.country_code,
        evaluationPeriod: s.evaluation_period,
        qualityScore: Number(s.quality_score),
        deliveryScore: Number(s.delivery_score),
        pricingScore: Number(s.pricing_score),
        complianceScore: Number(s.compliance_score),
        overallScore: Number(s.overall_score),
        evaluatorId: s.evaluator_id,
        evaluatorName: s.evaluator_name,
        evaluatorRole: s.evaluator_role,
        notes: s.notes,
        createdAt: s.created_at
      })) as VendorScorecard[];
    } catch {
      return [];
    }
  },

  async createScorecard(scorecard: Omit<VendorScorecard, 'id' | 'createdAt'>) {
    const db = {
      supplier_id: scorecard.supplierId,
      country_code: scorecard.countryCode || 'ET',
      evaluation_period: scorecard.evaluationPeriod,
      quality_score: scorecard.qualityScore,
      delivery_score: scorecard.deliveryScore,
      pricing_score: scorecard.pricingScore,
      compliance_score: scorecard.complianceScore,
      overall_score: scorecard.overallScore,
      evaluator_id: scorecard.evaluatorId,
      evaluator_name: scorecard.evaluatorName,
      evaluator_role: scorecard.evaluatorRole,
      notes: scorecard.notes || null
    };

    const { data, error } = await supabase.from('vendor_scorecards').insert(db).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // VENDOR RELATIONS: CONTRACTS
  // ==========================================
  async getContracts(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_contracts')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map((c: any) => ({
        id: c.id,
        supplierId: c.supplier_id,
        countryCode: c.country_code,
        contractNumber: c.contract_number,
        title: c.title,
        contractType: c.contract_type,
        status: c.status,
        startDate: c.start_date,
        endDate: c.end_date,
        paymentTerms: c.payment_terms,
        autoRenew: c.auto_renew,
        agreedMarginPct: c.agreed_margin_pct ? Number(c.agreed_margin_pct) : undefined,
        notes: c.notes,
        createdBy: c.created_by,
        createdAt: c.created_at
      })) as VendorContract[];
    } catch {
      return [];
    }
  },

  async createContract(contract: Omit<VendorContract, 'id' | 'createdAt'>) {
    const db = {
      supplier_id: contract.supplierId,
      country_code: contract.countryCode || 'ET',
      contract_number: contract.contractNumber,
      title: contract.title,
      contract_type: contract.contractType,
      status: contract.status || 'Active',
      start_date: contract.startDate,
      end_date: contract.endDate,
      payment_terms: contract.paymentTerms,
      auto_renew: contract.autoRenew || false,
      agreed_margin_pct: contract.agreedMarginPct || null,
      notes: contract.notes || null,
      created_by: contract.createdBy || 'Authorized Manager'
    };

    const { data, error } = await supabase.from('vendor_contracts').insert(db).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // VENDOR RELATIONS: FARMER PROGRAMS
  // ==========================================
  async getFarmerPrograms(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('farmer_programs')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map((f: any) => ({
        id: f.id,
        countryCode: f.country_code,
        programName: f.program_name,
        cooperativeName: f.cooperative_name,
        region: f.region,
        primaryCrops: f.primary_crops || [],
        memberCount: Number(f.member_count || 0),
        leadContact: f.lead_contact,
        phone: f.phone,
        fairTradeCertified: f.fair_trade_certified,
        organicCertified: f.organic_certified,
        status: f.status,
        managerName: f.manager_name,
        createdAt: f.created_at
      })) as FarmerProgram[];
    } catch {
      return [];
    }
  },

  async createFarmerProgram(program: Omit<FarmerProgram, 'id' | 'createdAt'>) {
    const db = {
      country_code: program.countryCode || 'ET',
      program_name: program.programName,
      cooperative_name: program.cooperativeName,
      region: program.region,
      primary_crops: program.primaryCrops,
      member_count: program.memberCount,
      lead_contact: program.leadContact || null,
      phone: program.phone || null,
      fair_trade_certified: program.fairTradeCertified,
      organic_certified: program.organicCertified,
      status: program.status || 'Active',
      manager_name: program.managerName || 'Vendor Relations Manager'
    };

    const { data, error } = await supabase.from('farmer_programs').insert(db).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // CUSTOMS & IMPORT DECLARATIONS
  // ==========================================
  async getCustomsDeclarations(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('customs_declarations')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map((c: any) => ({
        id: c.id,
        declarationNumber: c.declaration_number,
        countryCode: c.country_code,
        portOfEntry: c.port_of_entry,
        transportMode: c.transport_mode,
        carrierName: c.carrier_name,
        billOfLading: c.bill_of_lading,
        letterOfCreditRef: c.letter_of_credit_ref,
        clearingAgent: c.clearing_agent,
        customsStatus: c.customs_status,
        dutyAmount: Number(c.duty_amount || 0),
        currency: c.currency,
        eta: c.eta,
        clearedAt: c.cleared_at,
        associatedPoNumbers: c.associated_po_numbers || [],
        specialistId: c.specialist_id,
        specialistName: c.specialist_name,
        notes: c.notes,
        createdAt: c.created_at
      })) as CustomsDeclaration[];
    } catch {
      return [];
    }
  },

  async createCustomsDeclaration(declaration: Omit<CustomsDeclaration, 'id' | 'createdAt'>) {
    const db = {
      declaration_number: declaration.declarationNumber,
      country_code: declaration.countryCode || 'ET',
      port_of_entry: declaration.portOfEntry,
      transport_mode: declaration.transportMode,
      carrier_name: declaration.carrierName || null,
      bill_of_lading: declaration.billOfLading || null,
      letter_of_credit_ref: declaration.letterOfCreditRef || null,
      clearing_agent: declaration.clearingAgent || null,
      customs_status: declaration.customsStatus || 'Submitted',
      duty_amount: declaration.dutyAmount || 0,
      currency: declaration.currency || 'ETB',
      eta: declaration.eta || null,
      associated_po_numbers: declaration.associatedPoNumbers || [],
      specialist_id: declaration.specialistId || 'USR',
      specialist_name: declaration.specialistName || 'Customs Specialist',
      notes: declaration.notes || null
    };

    const { data, error } = await supabase.from('customs_declarations').insert(db).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // INBOUND DOCK QC INSPECTIONS
  // ==========================================
  async getInboundQCInspections(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('inbound_qc_inspections')
        .select('*')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []).map((q: any) => ({
        id: q.id,
        poId: q.po_id,
        poNumber: q.po_number,
        siteId: q.site_id,
        countryCode: q.country_code,
        inspectorId: q.inspector_id,
        inspectorName: q.inspector_name,
        inspectorRole: q.inspector_role,
        inspectionDate: q.inspection_date,
        sampleSize: Number(q.sample_size),
        coldChainTempCelsius: q.cold_chain_temp_celsius ? Number(q.cold_chain_temp_celsius) : undefined,
        tempComplianceStatus: q.temp_compliance_status,
        packagingIntegrity: q.packaging_integrity,
        expiryCheck: q.expiry_check,
        foodSafetyPassed: Boolean(q.food_safety_passed),
        discrepancyFound: Boolean(q.discrepancy_found),
        discrepancyDetails: q.discrepancy_details,
        disposition: q.disposition,
        supervisorNotes: q.supervisor_notes,
        createdAt: q.created_at
      })) as InboundQCInspection[];
    } catch {
      return [];
    }
  },

  async createInboundQCInspection(inspection: Omit<InboundQCInspection, 'id' | 'createdAt'>) {
    const db = {
      po_id: inspection.poId || null,
      po_number: inspection.poNumber || null,
      site_id: inspection.siteId || null,
      country_code: inspection.countryCode || 'ET',
      inspector_id: inspection.inspectorId,
      inspector_name: inspection.inspectorName,
      inspector_role: inspection.inspectorRole || 'inbound_qc_inspector',
      inspection_date: inspection.inspectionDate || new Date().toISOString(),
      sample_size: inspection.sampleSize || 10,
      cold_chain_temp_celsius: inspection.coldChainTempCelsius || null,
      temp_compliance_status: inspection.tempComplianceStatus || 'Compliant',
      packaging_integrity: inspection.packagingIntegrity || 'Passed',
      expiry_check: inspection.expiryCheck || 'Passed',
      food_safety_passed: inspection.foodSafetyPassed,
      discrepancy_found: inspection.discrepancyFound,
      discrepancy_details: inspection.discrepancyDetails || null,
      disposition: inspection.disposition || 'Accepted',
      supervisor_notes: inspection.supervisorNotes || null
    };

    const { data, error } = await supabase.from('inbound_qc_inspections').insert(db).select().single();
    if (error) throw error;
    return data;
  }
};

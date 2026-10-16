/**
-- Zero-Trust Procurement Types & Models
-- Provides structured reason codes, vendor scorecards, customs declarations, and inbound dock QC
*/

export type POApprovalReasonCode =
  | 'STANDARD_REPLENISHMENT'
  | 'EMERGENCY_STOCK_OUT'
  | 'DIRECT_FARMER_PURCHASE'
  | 'COOPERATIVE_BULK_ORDER'
  | 'PROMOTIONAL_STOCKING'
  | 'PRICE_PROTECTION_PURCHASE'
  | 'EXECUTIVE_SPECIAL_AUTHORIZATION';

export type PORejectionReasonCode =
  | 'PRICE_UNFAVORABLE'
  | 'BUDGET_OVERRUN'
  | 'EXCESSIVE_STOCK_ON_HAND'
  | 'VENDOR_NON_COMPLIANT'
  | 'SUSPECTED_DUPLICATE_ORDER'
  | 'SPECIFICATION_MISMATCH'
  | 'UNAUTHORIZED_DESTINATION';

export interface POApprovalPayload {
  poId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  reasonCode: POApprovalReasonCode;
  notes?: string;
  gpsCoords?: string;
}

export interface PORejectionPayload {
  poId: string;
  rejectorId: string;
  rejectorName: string;
  rejectorRole: string;
  reasonCode: PORejectionReasonCode;
  notes?: string;
  gpsCoords?: string;
}

export interface VendorScorecard {
  id: string;
  supplierId: string;
  countryCode: string;
  evaluationPeriod: string;
  qualityScore: number;
  deliveryScore: number;
  pricingScore: number;
  complianceScore: number;
  overallScore: number;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  notes?: string;
  createdAt: string;
}

export interface VendorContract {
  id: string;
  supplierId: string;
  countryCode: string;
  contractNumber: string;
  title: string;
  contractType: string;
  status: 'Active' | 'Expired' | 'Pending Renewal' | 'Terminated' | 'Pending Sign-Off';
  startDate: string;
  endDate: string;
  paymentTerms: string;
  autoRenew: boolean;
  agreedMarginPct?: number;
  notes?: string;
  createdBy?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  signedOffRole?: string;
  createdAt: string;
}

export interface FarmerProgram {
  id: string;
  countryCode: string;
  programName: string;
  cooperativeName: string;
  region: string;
  primaryCrops: string[];
  memberCount: number;
  leadContact?: string;
  phone?: string;
  fairTradeCertified: boolean;
  organicCertified: boolean;
  status: 'Active' | 'Inactive';
  managerName?: string;
  createdAt: string;
}

export interface CustomsDeclaration {
  id: string;
  declarationNumber: string;
  countryCode: string;
  portOfEntry: string;
  transportMode: 'Sea / Maritime' | 'Air Cargo' | 'Road Freight' | 'Rail';
  carrierName?: string;
  billOfLading?: string;
  letterOfCreditRef?: string;
  clearingAgent?: string;
  customsStatus: 'Submitted' | 'In Inspection' | 'Duty Assessed' | 'Duty Paid' | 'Cleared' | 'Rejected';
  dutyAmount: number;
  currency: string;
  eta?: string;
  clearedAt?: string;
  clearedBy?: string;
  clearedByRole?: string;
  associatedPoNumbers?: string[];
  specialistId?: string;
  specialistName?: string;
  notes?: string;
  createdAt: string;
}

export interface InboundQCInspection {
  id: string;
  poId?: string;
  poNumber?: string;
  siteId?: string;
  countryCode: string;
  inspectorId: string;
  inspectorName: string;
  inspectorRole: string;
  inspectionDate: string;
  sampleSize: number;
  coldChainTempCelsius?: number;
  tempComplianceStatus: 'Compliant' | 'Breach' | 'Exempt';
  packagingIntegrity: 'Passed' | 'Damaged' | 'Compromised';
  expiryCheck: 'Passed' | 'Near Expiry' | 'Expired';
  foodSafetyPassed: boolean;
  discrepancyFound: boolean;
  discrepancyDetails?: string;
  disposition: 'Accepted' | 'Conditionally Accepted' | 'Rejected' | 'Quarantined';
  supervisorNotes?: string;
  supervisorWaivedBy?: string;
  supervisorWaivedAt?: string;
  supervisorWaivedReason?: string;
  createdAt: string;
}

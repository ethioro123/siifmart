import { KnowledgeEntry } from '../RoadmapTypes';

export const CORPORATE_MERCHANDISING_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-corporate-merchandising-sop-037',
    title: 'Corporate Merchandising, Central Price Administration & Zero-Trust Pricing Policy (SOP-MER-037)',
    description: 'Establishes Merchandising as a centralized Corporate Administration Directorate function (Level 2, Rank 82). Enforces absolute Zero-Trust lockout of store-level personnel from editing retail prices, mandates dual-control margin approvals with Finance, and governs Synaptic Neural Mesh price propagation.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
    tags: [
      'Country Commercial Director',
      'Corporate Administration',
      'Zero-Trust',
      'Price Sovereignty',
      'Margin Protection',
      '4-Eyes Principle',
      'Synaptic Neural Mesh',
      'SOP',
      'RULE-COMPLIANT'
    ],
    content: `================================================================================
SIIFMART ENTERPRISE WORKFORCE & MANAGERIAL DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-MER-037
ROLE: HEAD OF MERCHANDISING (LEVEL 2 — HIERARCHY RANK 82, MATRIX RANK 24)
GOVERNANCE: CORPORATE ADMINISTRATION / COMMERCIAL DIRECTORATE
REPORTS TO: CHIEF EXECUTIVE OFFICER (CEO / SUPER_ADMIN)
TRACEABILITY: .agent/RULES.md (Rule 1: Zero-Trust, Rule 2: Merchandising Separation, Rule 10: Synaptic Neural Mesh)
================================================================================

1. EXECUTIVE MANDATE & CORPORATE ADMINISTRATION PLACEMENT
--------------------------------------------------------------------------------
1.1 Position Summary:
    - The Country Commercial Director operates at Level 2 (Corporate Directorate) within Corporate Administration, reporting directly to the CEO with functional coordination with the Country Operations Director and Country Finance Director.
    - Serves as the enterprise commercial custodian of product assortment, retail pricing architecture, gross margins, supplier markups, competitor price indexing, promotional campaigns, and master planograms.
1.2 Strategic Directorate Scope:
    - Merchandising is strictly a CENTRAL CORPORATE ADMINISTRATION function.
    - It does NOT belong to store floor staff. All master price books, category margins, and promotional rules reside exclusively at Corporate HQ (/pricing).

2. ZERO-TRUST STORE FLOOR PRICING LOCKDOWN (RULE 1 & RULE 2)
--------------------------------------------------------------------------------
2.1 Absolute Store Staff Price Lockout:
    - Branch Managers, Assistant Managers, Shift Leads, Store Supervisors, Cashiers, and Store Merchandisers have ZERO authority to alter base retail prices, modify system landed costs, or create ad-hoc discounts at the point of sale.
    - Any attempt by store-level personnel to edit prices is blocked at the RBAC layer, permissions matrix, and database RLS policy.
2.2 Clear Separation of Duties:
    - Corporate Country Commercial Director (HQ): Determines master pricing, gross margins, dynamic price rules, and visual planograms.
    - Store Supervisor & Visual Merchandisers (Store Floor): Responsible solely for physical shelf execution, FEFO rotation, and printing replacement shelf tags to match HQ prices with 100% parity.

3. DUAL-CONTROL MARGIN GOVERNANCE & 4-EYES SIGN-OFF
--------------------------------------------------------------------------------
3.1 Gross Margin Guardrails:
    - Every retail price must adhere to enterprise margin formulas:
      Base Retail = Landed Cost + (Target Category Margin %).
    - Target margin floors (e.g. minimum 18% on staples, 32% on fresh perishables, 40% on personal care) are locked in system config.
3.2 4-Eyes Dual Approval for Price Overrides:
    - Any promotional price drop, markdown, or rule modification that causes a product's projected gross margin to dip below the country threshold (< 15%) requires mandatory dual-authorization from the Country Finance Director before activation.

4. SYNAPTIC NEURAL MESH PRICE PROPAGATION (RULE 10)
--------------------------------------------------------------------------------
4.1 Real-Time Network Synchronization:
    - When a price is updated or a promotional rule is activated in Merchandising Intelligence (/pricing):
      a) POS Checkout Registers: Instantaneous socket sync across all target store terminals. Cashiers scan and bill the exact new price with zero delay.
      b) Store Floor Operations: Automatic push notification sent to the on-duty Store Supervisor and handheld scanner hubs to print updated physical shelf labels.
      c) Financial Accounting: Real-time recalculation of inventory valuation and projected gross profitability.

5. NATIONAL PRICE SOVEREIGNTY & MULTI-COUNTRY ISOLATION (RULES 7 & 8)
--------------------------------------------------------------------------------
5.1 Local Currency Exclusivity:
    - Ethiopian retail prices are explicitly managed in Ethiopian Birr (ETB).
    - Kenyan retail prices are explicitly managed in Kenyan Shillings (KSh).
    - Live exchange rate cross-conversions of retail shelf prices are strictly prohibited. Each national market operates an independent pricing structure reflecting local purchasing power, customs duties, and local supplier terms.
================================================================================`
  }
];

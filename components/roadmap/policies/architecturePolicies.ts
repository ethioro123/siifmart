import { KnowledgeEntry } from '../RoadmapTypes';

export const ARCHITECTURE_POLICIES: KnowledgeEntry[] = [
  {
    id: 'policy-synaptic-neural-mesh-sop-014',
    title: 'Synaptic Neural Mesh Operational Propagation Standard (SOP-SYS-014)',
    description: 'The 5 Foundational Laws of Synaptic Propagation: Zero isolated operational silos, automated downstream event cascades, cybernetic backpropagation, and sovereign border insulation.',
    department: 'admin',
    type: 'policy',
    priority: 'critical',
    status: 'active',
    isStarred: true,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Synaptic Mesh', 'Event Cascade', 'Real-Time Propagation', 'Neural Architecture', 'Anti-Silo', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE ARCHITECTURE & SYSTEMS DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-SYS-014
POLICY: SYNAPTIC NEURAL MESH OPERATIONAL PROPAGATION STANDARD
CLASSIFICATION: MANDATORY — APPLIES TO ALL SYSTEM ARCHITECTURE & INTEGRATIONS
TRACEABILITY: .agent/RULES.md (Rule 10 & Synaptic Neural Mesh Architecture)
================================================================================

1. FOUNDATIONAL LAW: ZERO ISOLATED OPERATIONAL SILOS
--------------------------------------------------------------------------------
1.1 Living Organism Principle:
    - A distributed retail enterprise is a single interconnected living organism.
    - No module (POS, Inventory, WMS, Procurement, Financials, Employees, Central Operations) may execute a mutation in isolation as a dead-end database write.
    - Every mutation MUST stimulate its downstream connected neural synapses to extract maximum operational intelligence.

2. THE SYNAPTIC SIGNAL CASCADE MAP
--------------------------------------------------------------------------------
2.1 Synapse Alpha: Point of Sale (POS) -> Downstream Cascade:
    - Neuron Event: Sale / Checkout Completed:
        * -> Inventory: Immediate FEFO lot deduction; triggers replenishment reorder if safety threshold breached.
        * -> WMS / Fulfillment: Enqueues internal branch transfer or pick mission.
        * -> Financials: Accrues gross profit margin, tax liability, tender split, and updates cashier drawer expected cash.
        * -> Gamification: Credits cashier volume/accuracy points; boosts branch score on national leaderboard.
        * -> Central Operations: Pulses real-time revenue velocity charts and live telemetry ticker.

2.2 Synapse Beta: Procurement & DC Receiving -> Downstream Cascade:
    - Neuron Event: Purchase Order Delivered & Verified at DC:
        * -> Inventory: Batch ingestion with expiry dates; recalculates Moving Average Landed Cost.
        * -> Merchandising: Re-evaluates target margin protection; initializes perishable markdown schedule.
        * -> Cross-Docking: Immediately releases pending backorders to outbound branch staging.
        * -> Financials: Creates Accounts Payable accrual; verifies 3-way match.

2.3 Synapse Gamma: Cargo Custody & Transfer Handshake -> Downstream Cascade:
    - Neuron Event: Transfer Manifest Verified with Discrepancies:
        * -> WMS: Updates receiving inventory to verified physical count.
        * -> Security: Logs CHAIN_OF_CUSTODY_DISCREPANCY with driver/receiver co-sign.
        * -> Gamification: Deducts accuracy penalty from responsible party.

3. THE SOVEREIGN MYELIN SHEATH (BORDER BLOOD-BRAIN BARRIER)
--------------------------------------------------------------------------------
3.1 Strict National Insulation:
    - While the neural network is ultra-dense within each country (ET, KE), signals MUST NEVER bleed across borders.
    - A Kenyan sale never alters Ethiopian inventory; an Ethiopian PO never alters Kenyan payables.
3.2 Circuit Breakers:
    - All synaptic handlers are idempotent, debounced, and protected by cycle-detection guards.`
  },
  {
    id: 'policy-config-gating-sop-015',
    title: 'Mandatory Logic Config-Gating & Country Scoping Policy (SOP-SYS-015)',
    description: 'Config-first operational governance: Every business rule, operational workflow, threshold, or policy must be controllable by a country-scoped setting in SystemConfig.',
    department: 'admin',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Config-Gating', 'Controllability', 'Country Scoping', 'System Config', 'Architecture', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE SYSTEM CONFIGURATION DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-SYS-015
POLICY: MANDATORY LOGIC CONFIG-GATING & COUNTRY SCOPING LAW
CLASSIFICATION: MANDATORY — APPLIES TO ALL BUSINESS LOGIC & SETTINGS ENGINES
TRACEABILITY: .agent/RULES.md (Rules 6 & 7, Config-First Architecture Section 5)
================================================================================

1. CONFIG-FIRST ARCHITECTURE MANDATE
--------------------------------------------------------------------------------
1.1 Mandatory Logic Gating:
    - For every operational workflow, threshold, or policy rule implemented in the system, engineers must ask:
      "Does this logic need a setting to control it?"
    - Hardcoding operational policies (e.g. blind count vs verified count, guest checkout, negative stock blocking, mandatory expiry, shift target revenue, QC sample rates) without a controlling setting in SystemConfig is strictly prohibited.

2. 100% COUNTRY-LEVEL SETTING ISOLATION
--------------------------------------------------------------------------------
2.1 Absolute Setting Partitioning:
    - EVERY setting in the system MUST be strictly partitioned and scoped per country (country_code).
    - A setting configured for Ethiopia (ET) MUST NEVER bleed, apply to, or alter behavior in Kenya (KE).
2.2 Per-Country Database Scoping:
    - All configuration records in system_config must be keyed by country_code. Queries and mutations must always explicitly target the active country scope.`
  },
  {
    id: 'policy-sovereign-clock-calendar-sop-011',
    title: 'Sovereign Time, Calendar & Linguistic Purity Policy (SOP-OPS-011)',
    description: 'National sovereignty of time and language: Ethiopic Solar Calendar vs Kenyan Gregorian calendar, zero inter-dialect mixing, digital clock digit wrap protection, and anti-duplication UI.',
    department: 'policy',
    type: 'policy',
    priority: 'high',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Sovereign Clock', 'Ethiopic Calendar', 'Linguistic Purity', 'Anti-Dialect Mixing', 'Ergonomics', 'SOP', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE LOCALIZATION & DISPLAY DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-OPS-011
POLICY: SOVEREIGN TIME, CALENDAR & LINGUISTIC PURITY LAW
CLASSIFICATION: MANDATORY — APPLIES TO ALL FRONTEND VIEWS, RECEIPTS & CLOCKS
TRACEABILITY: .agent/RULES.md (Rules 11 & 12, Sections 7 & 8)
================================================================================

1. LINGUISTIC PURITY & ANTI-DIALECT MIXING
--------------------------------------------------------------------------------
1.1 Zero Inter-Dialect Concatenation:
    - In multi-lingual national environments, strings must NEVER be concatenated into mixed bilingual monstrosities (e.g. NEVER write "Jimaata (ዓርብ), Fuulbana (መስከረም)").
1.2 Strict Language Isolation:
    - UI presentation strictly follows active language (useLanguage()):
        * Amharic (am): 100% pure Amharic script (ዓርብ፣ መስከረም 22፣ 2019 ዓ.ም).
        * Afaan Oromoo (or): 100% pure Afaan Oromoo (Jimaata, Fulbaana 22, 2019).
        * Swahili (sw): 100% pure Swahili (Ijumaa, 2 Oktoba 2026).
        * English (en): 100% pure English (Friday, Meskerem 22, 2019).

2. SOVEREIGN NATIONAL CALENDAR & DIGITAL CLOCK DISPLAY
--------------------------------------------------------------------------------
2.1 Sovereign Calendar Systems:
    - Ethiopia (ET): Ethiopic Solar Calendar (13 Ge'ez months, traditional 12-hour cycle with dawn offset at 06:00) + Africa/Addis_Ababa timezone.
    - Kenya (KE): Kenyan National Calendar (Swahili / English) + Africa/Nairobi timezone.
2.2 Live Monospace Clock Digit Protection:
    - All live digital clock elements (00:00:00) MUST enforce flex-nowrap whitespace-nowrap shrink-0 to guarantee digits never wrap vertically into a column.
2.3 Anti-Duplication UI Law:
    - Never render duplicate calendar date widgets side-by-side. A single unified Sovereign Clock & Calendar card must be used.`
  },
  {
    id: 'policy-header-ergonomics-sop-016',
    title: 'Header Ergonomics & Heavy Action Hierarchy Standard (SOP-UX-016)',
    description: 'Operational control room architecture: Lean top navigation reserved for live telemetry, shift indicators, and sovereign time; heavy actions positioned in dedicated bottom suites.',
    department: 'general',
    type: 'policy',
    priority: 'medium',
    status: 'active',
    isStarred: false,
    createdAt: '2026-10-02T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    tags: ['Header Ergonomics', 'Control Room', 'Heavy Action Hierarchy', 'UX Architecture', 'Standards', 'RULE-COMPLIANT'],
    content: `================================================================================
SIIFMART ENTERPRISE USER EXPERIENCE & ERGONOMICS DIRECTIVE
STANDARD OPERATING PROCEDURE: SOP-UX-016
POLICY: HEADER ERGONOMICS & HEAVY ACTION HIERARCHY
CLASSIFICATION: MANDATORY — APPLIES TO ALL OPERATIONAL DASHBOARDS & SCREENS
TRACEABILITY: .agent/RULES.md (Rule 14 & Section 10: Header Ergonomics)
================================================================================

1. LEAN OPERATIONAL CONTROL ROOM HEADERS
--------------------------------------------------------------------------------
1.1 Dedicated Telemetry Bar:
    - Top operational headers (Central Operations, POS Command, WMS Control) represent live operational control rooms.
    - Headers must remain lean and strictly dedicated to:
        * Live Telemetry & System Status
        * Sovereign Live Clock & Calendar
        * Active Shift Indicators & Site Scoping
        * Instant Search & Filters

2. HEAVY ACTION PLACEMENT IN BOTTOM SUITES
--------------------------------------------------------------------------------
2.1 Heavy Action Demarcation:
    - Buttons initiating resource-intensive or batch operations (e.g. "Get App (macOS)", "Executive Quarterly Export", "Mass CSV Import", "Full Database Sync") MUST NOT clutter top navigation bars.
2.2 Bottom Suite Architecture:
    - Heavy actions must be positioned in dedicated bottom operational suites, footers, or action drawers, maintaining zero visual distraction for frontline operators.`
  }
];

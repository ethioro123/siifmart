import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Modern CSS Token Layer & Aesthetic Architecture', () => {
  const rootDir = process.cwd();
  const themeCssPath = path.join(rootDir, 'styles', 'theme.css');
  const legacyCssPath = path.join(rootDir, 'styles', 'legacy-remapping.css');
  const indexCssPath = path.join(rootDir, 'index.css');
  const topbarPath = path.join(rootDir, 'components', 'TopBar.tsx');
  const agentsRulePath = path.join(rootDir, '.agents', 'AGENTS.md');
  const rulesPath = path.join(rootDir, '.agent', 'RULES.md');

  it('verifies all theme stylesheets and rule docs exist', () => {
    expect(fs.existsSync(themeCssPath)).toBe(true);
    expect(fs.existsSync(legacyCssPath)).toBe(true);
    expect(fs.existsSync(indexCssPath)).toBe(true);
    expect(fs.existsSync(agentsRulePath)).toBe(true);
    expect(fs.existsSync(rulesPath)).toBe(true);
  });

  it('enforces Rule 2 (all style files strictly under 500 lines)', () => {
    const themeLines = fs.readFileSync(themeCssPath, 'utf8').split('\n').length;
    const legacyLines = fs.readFileSync(legacyCssPath, 'utf8').split('\n').length;
    const indexLines = fs.readFileSync(indexCssPath, 'utf8').split('\n').length;
    const topbarLines = fs.readFileSync(topbarPath, 'utf8').split('\n').length;
    const agentsLines = fs.readFileSync(agentsRulePath, 'utf8').split('\n').length;

    expect(themeLines).toBeLessThan(500);
    expect(legacyLines).toBeLessThan(500);
    expect(indexLines).toBeLessThan(500);
    expect(topbarLines).toBeLessThan(500);
    expect(agentsLines).toBeLessThan(500);
  });

  it('verifies Rule 20, Rule 21, Rule 22, and Rule 23 are codified in project rules', () => {
    const agentsContent = fs.readFileSync(agentsRulePath, 'utf8');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const allRulesContent = agentsContent + '\n' + rulesContent;

    // Rule 20: Mandatory Apple Minimalist & Liquid Glass Design Standard Audit
    expect(allRulesContent).toContain('Mandatory Apple Minimalist & Liquid Glass Design Standard');
    expect(rulesContent).toContain('Mandatory Apple Minimalist & Liquid Glass Design Standard');

    // Rule 21: Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard Audit
    expect(allRulesContent).toContain('Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard');
    expect(rulesContent).toContain('Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard');

    // Rule 22: Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard Audit
    expect(allRulesContent).toContain('Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard');
    expect(rulesContent).toContain('Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard');

    // Rule 23: Mandatory Zero-Emoji & Professional Vector Iconography Standard Audit
    expect(allRulesContent).toContain('Mandatory Zero-Emoji & Professional Vector Iconography Standard');
    expect(rulesContent).toContain('Mandatory Zero-Emoji & Professional Vector Iconography Standard (SF Symbols Philosophy)');

    // Rule 24: Mandatory Universal Theme & Aesthetic Application Audit Across All Domains
    expect(allRulesContent).toContain('Mandatory Universal Theme & Aesthetic Application');
    expect(rulesContent).toContain('Mandatory Universal Theme & Aesthetic Application Across All Domains');

    // Rule 25: Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle Audit
    expect(allRulesContent).toContain('Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle');
    expect(rulesContent).toContain('Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle');

    // Don'ts rules
    expect(allRulesContent).toContain("decorative gradients, glow blobs, or multi-colo");
    expect(allRulesContent).toContain("backdrop-filter: blur()");
    expect(rulesContent).toContain("Don't use expensive `backdrop-filter: blur()` or heavy animations in Fulfillment mobile viewports");
    expect(agentsContent).not.toContain("use sand/emerald/amber palette");
    expect(rulesContent).not.toContain("use sand/emerald/amber palette");
    expect(rulesContent).not.toContain("### Design Tokens (Sand / Emerald / Amber)");
    expect(rulesContent).toContain("### Design Tokens (Apple Liquid Glass & Pure Contrast Architecture)");
    expect(allRulesContent).toContain("Don't hardcode aesthetic styling (raw hex colors, font families, static card fills, fixed borders, or shadows)");
    expect(allRulesContent).toContain("Don't use raw Unicode emojis");
    expect(rulesContent).toContain("Don't use raw Unicode emojis (e.g. ⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) anywhere in the UI");
    expect(allRulesContent).toContain("Don't review, create, or edit code in any domain");
    expect(rulesContent).toContain("Don't review, create, or edit code in any domain (e.g. Procurement, Financials, WMS, POS, HR) without simultaneously verifying");
    expect(allRulesContent).toContain("Don't allow the design system or UI components to drift or lag behind");
    expect(rulesContent).toContain("Don't allow the design system or UI components to drift or lag behind Apple's latest aesthetic standard");
    expect(allRulesContent).toContain("Don't use muddy gray cards");
    expect(rulesContent).toContain("Don't use muddy gray cards (#1C1C1E / #2C2C2E)");
    expect(allRulesContent).toContain("Don't treat interfaces as a \"collection of boxes\" or card traps");
    expect(rulesContent).toContain("Don't treat interfaces as a \"collection of boxes\" or card traps");
    expect(allRulesContent).toContain("Don't place Liquid Glass materials everywhere");
    expect(rulesContent).toContain("Don't place Liquid Glass materials everywhere");
  });

  it('verifies Rule 20 Apple Web Minimalist tokens in styles/theme.css', () => {
    const themeContent = fs.readFileSync(themeCssPath, 'utf8');

    // Dark Mode tokens: Apple OLED Black & Studio Pure Contrast Architecture
    expect(themeContent).toContain('--theme-bg-app: #000000;');
    expect(themeContent).toContain('--theme-bg-panel: #000000;');
    expect(themeContent).toContain('--theme-bg-card: #000000;');
    expect(themeContent).not.toContain('--theme-bg-card: #1C1C1E;');
    expect(themeContent).toContain('--theme-primary: #FFFFFF;');
    expect(themeContent).toContain('--theme-primary-text: #000000;');
    expect(themeContent).toContain('--theme-text-primary: #F5F5F7;');
    expect(themeContent).toContain('--theme-text-secondary: #86868B;');

    // Light Mode tokens: Apple Web Canvas & Pure White Cards
    expect(themeContent).toContain('[data-theme="light"]');
    expect(themeContent).toContain('--theme-bg-app: #F5F5F7;');
    expect(themeContent).toContain('--theme-bg-panel: #FFFFFF;');
    expect(themeContent).toContain('--theme-bg-card: #FFFFFF;');
    expect(themeContent).toContain('--theme-primary: #1D1D1F;');
    expect(themeContent).toContain('--theme-primary-text: #FFFFFF;');
    expect(themeContent).toContain('--theme-text-primary: #1D1D1F;');

    // Backward-compatibility variable aliases
    expect(themeContent).toContain('--bg-app: var(--theme-bg-app);');
    expect(themeContent).toContain('--color-primary: var(--theme-primary);');
  });

  it('verifies Rule 21 Low-End Mobile Performance overrides in index.css', () => {
    const indexContent = fs.readFileSync(indexCssPath, 'utf8');

    expect(indexContent).toContain('@media (max-width: 768px)');
    expect(indexContent).toContain('backdrop-filter: none !important;');
    expect(indexContent).toContain('background-color: var(--theme-bg-panel) !important;');
    expect(indexContent).toContain('touch-action: manipulation;');
    expect(indexContent).toContain('min-height: 44px;');
  });

  it('verifies Rule 22 Zero-Hardcoded Aesthetic in TopBar.tsx and GlassKPICard.tsx', () => {
    const topbarContent = fs.readFileSync(topbarPath, 'utf8');
    const kpiPath = path.join(rootDir, 'components', 'dashboard', 'widgets', 'GlassKPICard.tsx');
    const kpiContent = fs.readFileSync(kpiPath, 'utf8');

    // TopBar: Seamless wallpaper match and zero borders
    expect(topbarContent).toContain("backgroundColor: 'var(--bg-app)'");
    expect(topbarContent).toContain('border-0 border-transparent shadow-none');
    expect(topbarContent).toContain('text-[var(--theme-text-secondary)]');
    expect(topbarContent).toContain('bg-[var(--theme-bg-subtle)]');

    // GlassKPICard: Semantic tokens for surfaces, text, and borders
    expect(kpiContent).toContain('bg-[var(--theme-bg-card)]');
    expect(kpiContent).toContain('border-[var(--theme-border)]');
    expect(kpiContent).toContain('text-[var(--theme-text-primary)]');
    expect(kpiContent).toContain('text-[var(--theme-text-muted)]');
    expect(kpiContent).toContain('text-[var(--theme-text-secondary)]');
  });

  it('verifies Central Operations uses Apple Minimalist aesthetic tokens', () => {
    const centralOpsPath = path.join(rootDir, 'pages', 'CentralOperations.tsx');
    const execDeckPath = path.join(rootDir, 'components', 'dashboard', 'CentralOpsExecutiveDeck.tsx');
    const headerPath = path.join(rootDir, 'components', 'dashboard', 'CentralOperationsHeader.tsx');

    const centralOpsContent = fs.readFileSync(centralOpsPath, 'utf8');
    const execDeckContent = fs.readFileSync(execDeckPath, 'utf8');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Accent color uses Apple off-white in dark and deep black in light
    expect(centralOpsContent).toContain("accentColor = isDark ? '#F5F5F7' : '#1D1D1F'");

    // Executive deck uses semantic card and text tokens
    expect(execDeckContent).toContain('bg-[var(--theme-bg-card)]');
    expect(execDeckContent).toContain('border-[var(--theme-border)]');
    expect(execDeckContent).toContain('text-[var(--theme-text-primary)]');

    // Header uses semantic tokens
    expect(headerContent).toContain('bg-[var(--theme-bg-card)]');
    expect(headerContent).toContain('text-[var(--theme-text-primary)]');
  });

  it('verifies zero SVG linearGradients remain in components and pages', () => {
    const posChartsPath = path.join(rootDir, 'components', 'pos-command', 'layout', 'POSCommandCharts.tsx');
    const overviewTabPath = path.join(rootDir, 'components', 'financials', 'OverviewTab.tsx');
    const budgetTabPath = path.join(rootDir, 'components', 'financials', 'BudgetTab.tsx');
    const inventoryOverviewPath = path.join(rootDir, 'components', 'inventory', 'InventoryOverview.tsx');
    const procurementDashPath = path.join(rootDir, 'components', 'procurement', 'ProcurementDashboard.tsx');
    const flowDynamicsPath = path.join(rootDir, 'components', 'wms-dashboard', 'DashboardFlowDynamics.tsx');
    const markdownTabPath = path.join(rootDir, 'components', 'merchandising', 'MarkdownTab.tsx');

    const files = [
      posChartsPath,
      overviewTabPath,
      budgetTabPath,
      inventoryOverviewPath,
      procurementDashPath,
      flowDynamicsPath,
      markdownTabPath
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('<linearGradient');
    }
  });

  it('verifies zero bg-gradient classes remain in pages', () => {
    const posCommandPath = path.join(rootDir, 'pages', 'POSCommand.tsx');
    const wmsDashboardPath = path.join(rootDir, 'pages', 'WMSDashboard.tsx');
    const posTerminalPath = path.join(rootDir, 'pages', 'POSTerminal.tsx');
    const procurementPagePath = path.join(rootDir, 'pages', 'Procurement.tsx');
    const locationSelectPath = path.join(rootDir, 'pages', 'LocationSelect.tsx');

    const pages = [
      posCommandPath,
      wmsDashboardPath,
      posTerminalPath,
      procurementPagePath,
      locationSelectPath
    ];

    for (const page of pages) {
      const content = fs.readFileSync(page, 'utf8');
      expect(content).not.toContain('bg-gradient');
      expect(content).not.toContain('blur-[1');
      expect(content).not.toContain('blur-[8');
    }
  });

  it('verifies zero bg-gradient and zero blur in POS Terminal and POS Command components', () => {
    const posFiles = [
      path.join(rootDir, 'components', 'pos', 'POSProductGrid.tsx'),
      path.join(rootDir, 'components', 'pos', 'POSCartPanel.tsx'),
      path.join(rootDir, 'components', 'pos', 'PinPad.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSHeader.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSCatalog.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSDepartments.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSFilterSidebar.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'MiscItemModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'PrintReceiptModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'ShiftClosingModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'ReturnModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'WeightEntryModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'PriceUpdatesModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'EmailReceiptModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'DiscountModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'StartShiftModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'CashDropModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'NoSaleKickModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'VoidAuthorizationModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'OverrideVelocityWidget.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'RecentTransactions.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'ShiftProgress.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'ShiftReconciliationTable.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'ShiftClosureModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'SafeLedgerModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'StartShiftModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'ReceivingModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'StockListModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingForm.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingPendingList.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingHistory.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingSummary.tsx'),
    ];

    for (const file of posFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('bg-gradient');
      expect(content).not.toContain('backdrop-blur');
      expect(content).not.toContain('blur-');
    }
  });

  it('verifies zero legacy green or cream hex codes in POS Command components', () => {
    const legacyPatterns = ['#2C5E3B', '#1E3F27', '#E2DCCE', '#FAF8F5', '#18201B', '#224429', '#A9CBA2'];
    const commandDir = path.join(rootDir, 'components', 'pos-command');

    function checkLegacy(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkLegacy(fullPath);
        } else if (/\.(tsx|ts)$/.test(entry.name) && !fullPath.includes('.test.')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const pattern of legacyPatterns) {
            expect(content).not.toContain(pattern);
          }
        }
      }
    }

    checkLegacy(commandDir);
  });

  it('enforces Rule 2 on all updated files', () => {
    const filesToCheck = [
      path.join(rootDir, 'pages', 'POSCommand.tsx'),
      path.join(rootDir, 'pages', 'WMSDashboard.tsx'),
      path.join(rootDir, 'pages', 'POSTerminal.tsx'),
      path.join(rootDir, 'pages', 'Procurement.tsx'),
      path.join(rootDir, 'pages', 'LocationSelect.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'POSCommandCharts.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'OverrideVelocityWidget.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'RecentTransactions.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'ShiftProgress.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'layout', 'ShiftReconciliationTable.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'ShiftClosureModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'SafeLedgerModal.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingForm.tsx'),
      path.join(rootDir, 'components', 'pos-command', 'modals', 'components', 'ReceivingSummary.tsx'),
      path.join(rootDir, 'components', 'pos', 'POSProductGrid.tsx'),
      path.join(rootDir, 'components', 'pos', 'POSCartPanel.tsx'),
      path.join(rootDir, 'components', 'pos', 'PinPad.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSHeader.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSCatalog.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSDepartments.tsx'),
      path.join(rootDir, 'components', 'pos', 'components', 'POSFilterSidebar.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'MiscItemModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'PrintReceiptModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'ShiftClosingModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'ReturnModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'WeightEntryModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'PriceUpdatesModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'EmailReceiptModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'DiscountModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'StartShiftModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'CashDropModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'NoSaleKickModal.tsx'),
      path.join(rootDir, 'components', 'pos', 'modals', 'VoidAuthorizationModal.tsx'),
    ];

    for (const file of filesToCheck) {
      const lineCount = fs.readFileSync(file, 'utf8').split('\n').length;
      expect(lineCount).toBeLessThan(500);
    }
  });

  it('verifies Rule 23 (zero raw unicode emojis in POS and POS Command components)', () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    const posDirs = [
      path.join(rootDir, 'components', 'pos'),
      path.join(rootDir, 'components', 'pos-command'),
    ];

    function checkDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(tsx|ts)$/.test(entry.name) && !fullPath.includes('.test.')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(emojiRegex.test(content)).toBe(false);
        }
      }
    }

    for (const dir of posDirs) {
      checkDir(dir);
    }
  });

  it('verifies October 2026 Apple Design System specification tokens and rules', () => {
    const themeContent = fs.readFileSync(themeCssPath, 'utf8');
    const agentsContent = fs.readFileSync(agentsRulePath, 'utf8');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const allRulesContent = agentsContent + '\n' + rulesContent;

    // 70 / 20 / 8 / 2 Golden Ratio Rule
    expect(allRulesContent).toContain('70 / 20 / 8 / 2 Golden Ratio');
    expect(rulesContent).toContain('70 / 20 / 8 / 2 Golden Ratio');

    // 3 Liquid Glass Tiers
    expect(themeContent).toContain('--theme-glass-clear-bg:');
    expect(themeContent).toContain('--theme-glass-standard-bg:');
    expect(themeContent).toContain('--theme-glass-strong-bg:');
    expect(themeContent).toContain('.glass-clear');
    expect(themeContent).toContain('.glass-standard');
    expect(themeContent).toContain('.glass-strong');
    expect(allRulesContent).toContain('Tier 1: Glass Clear');
    expect(rulesContent).toContain('Tier 1: Glass Clear');

    // Standardized Corner Radii System
    expect(themeContent).toContain('--radius-xs: 6px;');
    expect(themeContent).toContain('--radius-sm: 10px;');
    expect(themeContent).toContain('--radius-md: 14px;');
    expect(themeContent).toContain('--radius-lg: 18px;');
    expect(themeContent).toContain('--radius-xl: 22px;');
    expect(themeContent).toContain('--radius-2xl: 28px;');
    expect(themeContent).toContain('--radius-pill: 999px;');

    // 4px Base Grid Spacing Scale
    expect(themeContent).toContain('--space-1: 4px;');
    expect(themeContent).toContain('--space-2: 8px;');
    expect(themeContent).toContain('--space-16: 64px;');

    // 44px Control Baseline
    expect(themeContent).toContain('--control-height-sm: 36px;');
    expect(themeContent).toContain('--control-height-md: 44px;');
    expect(themeContent).toContain('--control-height-lg: 52px;');

    // Motion & Spring Dynamics
    expect(themeContent).toContain('--ease-apple: cubic-bezier(0.2, 0.8, 0.2, 1);');
    expect(themeContent).toContain('--duration-fast: 120ms;');
    expect(themeContent).toContain('--duration-normal: 200ms;');
    expect(themeContent).toContain('--duration-slow: 320ms;');

    // Soft Elevation Shadows
    expect(themeContent).toContain('--shadow-sm:');
    expect(themeContent).toContain('--shadow-md:');
    expect(themeContent).toContain('--shadow-lg:');
    expect(themeContent).toContain('--shadow-modal:');

    // 11-Point "Apple Test" Checklist
    expect(allRulesContent).toContain('11-Point "Apple Test" Audit');
    expect(rulesContent).toContain('11-Point "Apple Test" Audit Checklist');

    // Enterprise Retail & WMS Synthesis Doctrine
    expect(allRulesContent).toContain('Enterprise Retail & WMS Synthesis Doctrine');
    expect(rulesContent).toContain('Enterprise Retail & WMS Synthesis Doctrine');

    // Anti-patterns codified
    expect(rulesContent).toContain('Aesthetic Anti-Patterns (Strictly Prohibited)');
  });
});


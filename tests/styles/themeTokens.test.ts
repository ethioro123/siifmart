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
  const designGuidePath = path.join(rootDir, 'docs', 'APPLE_DESIGN_GUIDE.md');
  const engineeringRulesPath = path.join(rootDir, '.agent', 'rules', '04-engineering-and-performance.md');

  it('verifies all theme stylesheets and rule docs exist', () => {
    expect(fs.existsSync(themeCssPath)).toBe(true);
    expect(fs.existsSync(legacyCssPath)).toBe(true);
    expect(fs.existsSync(indexCssPath)).toBe(true);
    expect(fs.existsSync(agentsRulePath)).toBe(true);
    expect(fs.existsSync(rulesPath)).toBe(true);
    expect(fs.existsSync(designGuidePath)).toBe(true);
    expect(fs.existsSync(engineeringRulesPath)).toBe(true);
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

  it('verifies UI standards and Apple minimalist design rules are codified', () => {
    const agentsContent = fs.readFileSync(agentsRulePath, 'utf8');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const designGuideContent = fs.readFileSync(designGuidePath, 'utf8');
    const engineeringRulesContent = fs.readFileSync(engineeringRulesPath, 'utf8');
    const allRulesContent = [agentsContent, rulesContent, designGuideContent, engineeringRulesContent].join('\n');

    // UI standards and Apple design guide alignment
    expect(allRulesContent).toContain('APPLE_DESIGN_GUIDE.md');
    expect(allRulesContent).toContain('docs/APPLE_DESIGN_GUIDE.md');
    expect(agentsContent).toContain('Use semantic theme tokens');
    expect(designGuideContent).toContain('Use semantic theme tokens');

    // Performance and hardware constraints
    expect(agentsContent).toContain('Fulfillment scanning has the strictest low-end device constraints');
    expect(engineeringRulesContent).toContain('Scope of Hardware Overrides');

    // Semantic tokens & Layered Charcoal Architecture
    expect(engineeringRulesContent).toContain('Design Tokens (Apple Liquid Glass & Pure Contrast Architecture)');
    expect(engineeringRulesContent).toContain('Softened Charcoal Surfaces');

    // Zero-emoji standard
    expect(agentsContent).toContain("don't rely on color alone or use emoji as interface decoration");

    // Prohibited anti-patterns
    expect(designGuideContent).toContain('Avoid decorative gradients, glow, stacked glass');
    expect(allRulesContent).not.toContain('use sand/emerald/amber palette');
  });

  it('verifies Apple Minimalist & Softened Charcoal tokens in styles/theme.css', () => {
    const themeContent = fs.readFileSync(themeCssPath, 'utf8');

    // Dark Mode tokens: Softened Layered Charcoal Architecture
    expect(themeContent).toContain('--theme-bg-app: #121316;');
    expect(themeContent).toContain('--theme-bg-panel: #18191E;');
    expect(themeContent).toContain('--theme-bg-card: #1F2128;');
    expect(themeContent).toContain('--theme-bg-card-hover: #272A33;');
    expect(themeContent).toContain('--theme-primary: #FFFFFF;');
    expect(themeContent).toContain('--theme-primary-text: #121316;');
    expect(themeContent).toContain('--theme-text-primary: #F5F5F7;');
    expect(themeContent).toContain('--theme-text-secondary: #A1A1AA;');
    expect(themeContent).toContain('--theme-text-muted: #80828D;');

    // Status color tokens (calm Apple HIG tones)
    expect(themeContent).toContain('--theme-status-success: #34C759;');
    expect(themeContent).toContain('--theme-status-warning: #FF9F0A;');
    expect(themeContent).toContain('--theme-status-danger: #FF453A;');
    expect(themeContent).toContain('--theme-status-info: #64D2FF;');
    expect(themeContent).toContain('--theme-status-neutral: #8E8E93;');

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

    // Accent color uses official Apple accent token (#2997FF in dark, #0071E3 in light)
    expect(centralOpsContent).toContain("accentColor = isDark ? '#2997FF' : '#0071E3'");

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

  it('verifies Apple Design System specification tokens and design system rules', () => {
    const themeContent = fs.readFileSync(themeCssPath, 'utf8');
    const agentsContent = fs.readFileSync(agentsRulePath, 'utf8');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const designGuideContent = fs.readFileSync(designGuidePath, 'utf8');
    const engineeringRulesContent = fs.readFileSync(engineeringRulesPath, 'utf8');
    const allRulesContent = [agentsContent, rulesContent, designGuideContent, engineeringRulesContent].join('\n');

    // Design System rules & architecture
    expect(allRulesContent).toContain('APPLE_DESIGN_GUIDE.md');
    expect(engineeringRulesContent).toContain('Design Tokens (Apple Liquid Glass & Pure Contrast Architecture)');

    // 3 Liquid Glass Tiers
    expect(themeContent).toContain('--theme-glass-clear-bg:');
    expect(themeContent).toContain('--theme-glass-standard-bg:');
    expect(themeContent).toContain('--theme-glass-strong-bg:');
    expect(themeContent).toContain('.glass-clear');
    expect(themeContent).toContain('.glass-standard');
    expect(themeContent).toContain('.glass-strong');
    expect(engineeringRulesContent).toContain('Liquid Glass 3 Tiers');

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

    // Visual Review Checklist in Apple Design Guide
    expect(designGuideContent).toContain('Visual review checklist');
    expect(designGuideContent).toContain('Is the user\'s main task obvious');

    // Prohibited anti-patterns in Apple Design Guide
    expect(designGuideContent).toContain('Avoid decorative gradients, glow, stacked glass, heavy shadows');
  });
});


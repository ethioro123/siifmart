/**
 * Verification Script for Manager Quick Access Features
 * This script checks if all the manager quick access components are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Manager Quick Access Implementation...\n');

const checks = [];

// Check 1: ManagerQuickAccess component exists
const quickAccessPath = path.join(__dirname, 'components/ManagerQuickAccess.tsx');
if (fs.existsSync(quickAccessPath)) {
    const content = fs.readFileSync(quickAccessPath, 'utf8');
    const hasWarehouseManager = content.includes("'warehouse_manager'");
    const hasDispatcher = content.includes("'dispatcher'");
    const hasFloatingButton = content.includes('Floating Action Button');

    checks.push({
        name: 'ManagerQuickAccess Component',
        status: hasWarehouseManager && hasDispatcher && hasFloatingButton ? '✅' : '❌',
        details: `Warehouse Manager: ${hasWarehouseManager ? '✅' : '❌'}, Dispatcher: ${hasDispatcher ? '✅' : '❌'}, FAB: ${hasFloatingButton ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'ManagerQuickAccess Component',
        status: '❌',
        details: 'File not found'
    });
}

// Check 2: ManagerDashboardBanner component exists
const bannerPath = path.join(__dirname, 'components/ManagerDashboardBanner.tsx');
if (fs.existsSync(bannerPath)) {
    const content = fs.readFileSync(bannerPath, 'utf8');
    const hasWarehouseManager = content.includes("'warehouse_manager'");
    const hasDispatcher = content.includes("'dispatcher'");
    const hasQuickLinks = content.includes('quickLinks');

    checks.push({
        name: 'ManagerDashboardBanner Component',
        status: hasWarehouseManager && hasDispatcher && hasQuickLinks ? '✅' : '❌',
        details: `Warehouse Manager: ${hasWarehouseManager ? '✅' : '❌'}, Dispatcher: ${hasDispatcher ? '✅' : '❌'}, Quick Links: ${hasQuickLinks ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'ManagerDashboardBanner Component',
        status: '❌',
        details: 'File not found'
    });
}

// Check 3: Layout integration
const layoutPath = path.join(__dirname, 'components/Layout.tsx');
if (fs.existsSync(layoutPath)) {
    const content = fs.readFileSync(layoutPath, 'utf8');
    const hasImport = content.includes("import ManagerQuickAccess");
    const hasComponent = content.includes("<ManagerQuickAccess />");

    checks.push({
        name: 'Layout Integration',
        status: hasImport && hasComponent ? '✅' : '❌',
        details: `Import: ${hasImport ? '✅' : '❌'}, Component: ${hasComponent ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'Layout Integration',
        status: '❌',
        details: 'File not found'
    });
}

// Check 4: Dashboard integration
const dashboardPath = path.join(__dirname, 'pages/Dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    const hasImport = content.includes("import ManagerDashboardBanner");
    const hasComponent = content.includes("<ManagerDashboardBanner />");
    const hasWarehouseManager = content.includes("'warehouse_manager'");
    const hasDispatcher = content.includes("'dispatcher'");

    checks.push({
        name: 'Dashboard Integration',
        status: hasImport && hasComponent && hasWarehouseManager && hasDispatcher ? '✅' : '❌',
        details: `Import: ${hasImport ? '✅' : '❌'}, Component: ${hasComponent ? '✅' : '❌'}, Roles: ${hasWarehouseManager && hasDispatcher ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'Dashboard Integration',
        status: '❌',
        details: 'File not found'
    });
}

// Check 5: WMSDashboard integration
const wmsDashboardPath = path.join(__dirname, 'pages/WMSDashboard.tsx');
if (fs.existsSync(wmsDashboardPath)) {
    const content = fs.readFileSync(wmsDashboardPath, 'utf8');
    const hasImport = content.includes("import ManagerDashboardBanner");
    const hasComponent = content.includes("<ManagerDashboardBanner />");

    checks.push({
        name: 'WMSDashboard Integration',
        status: hasImport && hasComponent ? '✅' : '❌',
        details: `Import: ${hasImport ? '✅' : '❌'}, Component: ${hasComponent ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'WMSDashboard Integration',
        status: '❌',
        details: 'File not found'
    });
}

// Check 6: Types updated
const typesPath = path.join(__dirname, 'types.ts');
if (fs.existsSync(typesPath)) {
    const content = fs.readFileSync(typesPath, 'utf8');
    const hasWarehouseManager = content.includes("'warehouse_manager'");
    const hasDispatcher = content.includes("'dispatcher'");
    const noWms = !content.includes("'wms'") || content.includes("// wms deprecated");

    checks.push({
        name: 'Type Definitions',
        status: hasWarehouseManager && hasDispatcher ? '✅' : '❌',
        details: `Warehouse Manager: ${hasWarehouseManager ? '✅' : '❌'}, Dispatcher: ${hasDispatcher ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'Type Definitions',
        status: '❌',
        details: 'File not found'
    });
}

// Check 7: Permissions updated
const permissionsPath = path.join(__dirname, 'utils/permissions.ts');
if (fs.existsSync(permissionsPath)) {
    const content = fs.readFileSync(permissionsPath, 'utf8');
    const hasWarehouseManager = content.includes("warehouse_manager: 'Warehouse Manager'");
    const hasDispatcher = content.includes("dispatcher: 'Warehouse Dispatcher'");

    checks.push({
        name: 'Permissions System',
        status: hasWarehouseManager && hasDispatcher ? '✅' : '❌',
        details: `Warehouse Manager: ${hasWarehouseManager ? '✅' : '❌'}, Dispatcher: ${hasDispatcher ? '✅' : '❌'}`
    });
} else {
    checks.push({
        name: 'Permissions System',
        status: '❌',
        details: 'File not found'
    });
}

// Print results
console.log('═══════════════════════════════════════════════════════════');
console.log('                  VERIFICATION RESULTS                      ');
console.log('═══════════════════════════════════════════════════════════\n');

checks.forEach((check, index) => {
    console.log(`${index + 1}. ${check.name}`);
    console.log(`   Status: ${check.status}`);
    console.log(`   Details: ${check.details}`);
    console.log('');
});

const allPassed = checks.every(check => check.status === '✅');

console.log('═══════════════════════════════════════════════════════════');
if (allPassed) {
    console.log('✅ ALL CHECKS PASSED! Manager Quick Access is fully integrated.');
    console.log('\n📝 To see the improvements:');
    console.log('   1. Open http://localhost:3002 in your browser');
    console.log('   2. Login as a manager or warehouse_manager');
    console.log('   3. Look for:');
    console.log('      - Floating green button (bottom-right corner)');
    console.log('      - Dashboard banner at the top');
    console.log('      - Press Ctrl+K to toggle quick access panel');
} else {
    console.log('❌ Some checks failed. Please review the details above.');
}
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(allPassed ? 0 : 1);

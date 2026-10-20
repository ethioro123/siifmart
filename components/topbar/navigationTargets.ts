export interface NavigationTarget {
    title: string;
    path: string;
    module: string;
    keywords: string[];
}

export const NAVIGATION_TARGETS: NavigationTarget[] = [
    { title: 'Central Operations', path: '/admin', module: 'admin', keywords: ['hq', 'dashboard', 'control', 'central'] },
    { title: 'Regional Command', path: '/regional-ops', module: 'regional-ops', keywords: ['region', 'territory', 'regional command', 'regional operations', 'hub'] },
    { title: 'POS Terminal', path: '/pos', module: 'pos', keywords: ['register', 'sale', 'checkout', 'till'] },
    { title: 'POS Operations', path: '/pos-dashboard', module: 'pos', keywords: ['command center', 'store', 'retail'] },
    { title: 'Inventory Management', path: '/inventory', module: 'inventory', keywords: ['stock', 'items', 'products', 'inventory'] },
    { title: 'Network Inventory', path: '/network-inventory', module: 'inventory', keywords: ['network', 'global stock'] },
    { title: 'Warehouse Ops / Fulfillment', path: '/wms-ops', module: 'warehouse', keywords: ['picking', 'packing', 'receiving', 'wms', 'fulfillment'] },
    { title: 'Job History', path: '/wms-ops?view=history', module: 'warehouse', keywords: ['past jobs', 'history', 'completed', 'logs'] },
    { title: 'Active Mission', path: '/wms-ops', module: 'warehouse', keywords: ['active job', 'current task', 'my job', 'mission'] },
    { title: 'Warehouse Dashboard', path: '/wms-dashboard', module: 'warehouse', keywords: ['stats', 'metrics', 'wms dashboard'] },
    { title: 'Procurement', path: '/procurement', module: 'procurement', keywords: ['po', 'purchase orders', 'buying'] },
    { title: 'Pricing & Merchandising', path: '/pricing', module: 'pricing', keywords: ['pricing', 'promotions', 'discounts'] },
    { title: 'Financials', path: '/finance', module: 'finance', keywords: ['finance', 'expenses', 'accounting'] },
    { title: 'Sales History', path: '/sales', module: 'sales', keywords: ['receipts', 'past sales', 'transactions'] },
    { title: 'Customers', path: '/customers', module: 'customers', keywords: ['clients', 'crm', 'customers'] },
    { title: 'Employees', path: '/employees', module: 'employees', keywords: ['staff', 'team', 'hr'] },
    { title: 'Settings', path: '/settings', module: 'settings', keywords: ['config', 'setup', 'preferences'] },
    { title: 'My Profile', path: '/profile', module: 'profile', keywords: ['profile', 'account', 'me'] },
    { title: 'Roadmap', path: '/roadmap', module: 'admin', keywords: ['roadmap', 'planning', 'brainstorm'] },
    { title: 'Location Select', path: '/location-select', module: 'admin', keywords: ['location', 'switch site', 'sites'] },
];

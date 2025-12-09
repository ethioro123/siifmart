/**
 * AI Contextual Help Service
 * Provides page-specific guidance and help
 */

interface ContextualHelp {
    page: string;
    title: string;
    description: string;
    features: string[];
    commonTasks: string[];
    tips: string[];
}

class AIContextualHelpService {
    private helpContent: Record<string, ContextualHelp> = {
        '/dashboard': {
            page: 'Dashboard',
            title: 'Dashboard Overview',
            description: 'Your central hub for monitoring business performance and key metrics.',
            features: [
                'View real-time KPIs and metrics',
                'Monitor sales and revenue',
                'Track inventory levels',
                'See recent activities'
            ],
            commonTasks: [
                'Check today\'s sales',
                'View low stock alerts',
                'Monitor pending orders',
                'Review employee performance'
            ],
            tips: [
                'Click on any KPI card for detailed view',
                'Use the date filter to view historical data',
                'Refresh data using the sync button'
            ]
        },

        '/inventory': {
            page: 'Inventory',
            title: 'Inventory Management',
            description: 'Manage all your products, stock levels, and inventory operations.',
            features: [
                'View all products and stock levels',
                'Add new products',
                'Adjust stock quantities',
                'Track product locations',
                'Monitor expiry dates',
                'Transfer stock between sites'
            ],
            commonTasks: [
                'Add a new product',
                'Check low stock items',
                'Adjust stock levels',
                'Search for a product',
                'Transfer stock to another site'
            ],
            tips: [
                'Use filters to find products quickly',
                'Set reorder points to get low stock alerts',
                'Scan barcodes for faster product lookup',
                'Export inventory reports for analysis'
            ]
        },

        '/procurement': {
            page: 'Procurement',
            title: 'Purchase Orders & Suppliers',
            description: 'Manage purchase orders, suppliers, and procurement operations.',
            features: [
                'Create purchase orders',
                'Manage suppliers',
                'Track order status',
                'Receive shipments',
                'View order history'
            ],
            commonTasks: [
                'Create a new PO',
                'View pending orders',
                'Receive a shipment',
                'Add a new supplier',
                'Approve pending POs'
            ],
            tips: [
                'POs must be approved before ordering',
                'Track delivery dates to plan inventory',
                'Use bulk ordering for better prices',
                'Maintain good supplier relationships'
            ]
        },

        '/wms': {
            page: 'Warehouse Operations',
            title: 'Warehouse Management System',
            description: 'Manage all warehouse operations including picking, packing, and dispatch.',
            features: [
                'Create and assign jobs',
                'Track pick/pack operations',
                'Manage putaway tasks',
                'Process dispatches',
                'Monitor job performance'
            ],
            commonTasks: [
                'Assign a pick job',
                'View pending jobs',
                'Complete a pack job',
                'Process dispatch',
                'Check job status'
            ],
            tips: [
                'Assign jobs based on employee availability',
                'Use zones to organize warehouse efficiently',
                'Track accuracy metrics to improve performance',
                'Process jobs in FIFO order when possible'
            ]
        },

        '/pos': {
            page: 'Point of Sale',
            title: 'POS System',
            description: 'Process sales, manage transactions, and handle customer interactions.',
            features: [
                'Process sales transactions',
                'Apply discounts',
                'Handle returns',
                'Print receipts',
                'View sales history'
            ],
            commonTasks: [
                'Start a new sale',
                'Search for a product',
                'Apply a discount',
                'Process payment',
                'Print receipt'
            ],
            tips: [
                'Use barcode scanner for faster checkout',
                'Verify customer details for loyalty points',
                'Check stock before completing sale',
                'End shift to reconcile cash drawer'
            ]
        },

        '/employees': {
            page: 'Employees',
            title: 'Employee Management',
            description: 'Manage employee records, roles, and performance.',
            features: [
                'View all employees',
                'Add new employees',
                'Assign roles and permissions',
                'Track performance',
                'Manage schedules'
            ],
            commonTasks: [
                'Add a new employee',
                'Update employee role',
                'View employee performance',
                'Search for an employee',
                'Assign to a site'
            ],
            tips: [
                'Assign appropriate roles for access control',
                'Track performance metrics regularly',
                'Keep contact information updated',
                'Use departments to organize teams'
            ]
        },

        '/customers': {
            page: 'Customers',
            title: 'Customer Management',
            description: 'Manage customer records, loyalty programs, and customer service.',
            features: [
                'View all customers',
                'Add new customers',
                'Track purchase history',
                'Manage loyalty points',
                'Handle customer service'
            ],
            commonTasks: [
                'Add a new customer',
                'Search for a customer',
                'View purchase history',
                'Update contact info',
                'Check loyalty points'
            ],
            tips: [
                'Collect customer data for better service',
                'Use loyalty programs to increase retention',
                'Track purchase patterns for marketing',
                'Respond to customer inquiries promptly'
            ]
        },

        '/finance': {
            page: 'Finance',
            title: 'Financial Management',
            description: 'Manage finances, expenses, and financial reporting.',
            features: [
                'View financial reports',
                'Track expenses',
                'Manage payroll',
                'Monitor revenue',
                'Generate financial statements'
            ],
            commonTasks: [
                'Record an expense',
                'View monthly report',
                'Process payroll',
                'Check revenue',
                'Export financial data'
            ],
            tips: [
                'Categorize expenses for better tracking',
                'Reconcile accounts regularly',
                'Use reports for financial planning',
                'Keep receipts and documentation'
            ]
        },

        '/settings': {
            page: 'Settings',
            title: 'System Settings',
            description: 'Configure system settings, sites, and preferences.',
            features: [
                'Manage sites',
                'Configure system settings',
                'Set up integrations',
                'Manage user preferences',
                'View system logs'
            ],
            commonTasks: [
                'Add a new site',
                'Update site details',
                'Configure settings',
                'View system logs',
                'Manage integrations'
            ],
            tips: [
                'Only super admins can change critical settings',
                'Test changes in a safe environment first',
                'Keep system settings documented',
                'Regular backups are essential'
            ]
        }
    };

    /**
     * Get help for current page
     */
    getHelp(pathname: string): ContextualHelp | null {
        // Extract base path
        const basePath = '/' + pathname.split('/')[1];
        return this.helpContent[basePath] || null;
    }

    /**
     * Get quick help summary
     */
    getQuickHelp(pathname: string): string {
        const help = this.getHelp(pathname);
        if (!help) {
            return 'No help available for this page.';
        }

        return `**${help.title}**\n\n${help.description}\n\nCommon tasks:\n${help.commonTasks.map(t => `- ${t}`).join('\n')}`;
    }

    /**
     * Search help content
     */
    searchHelp(query: string): ContextualHelp[] {
        const lowerQuery = query.toLowerCase();
        const results: ContextualHelp[] = [];

        Object.values(this.helpContent).forEach(help => {
            const searchText = `${help.title} ${help.description} ${help.features.join(' ')} ${help.commonTasks.join(' ')}`.toLowerCase();

            if (searchText.includes(lowerQuery)) {
                results.push(help);
            }
        });

        return results;
    }

    /**
     * Get all available help pages
     */
    getAllHelp(): ContextualHelp[] {
        return Object.values(this.helpContent);
    }
}

export const aiContextualHelpService = new AIContextualHelpService();

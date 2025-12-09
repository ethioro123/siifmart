/**
 * AI Action Executor Service
 * Allows AI to perform actions on behalf of users
 * Super admin only for security
 */

import { productsService, purchaseOrdersService, employeesService, wmsJobsService } from './supabase.service';

export interface AIAction {
    type:
    // Procurement & Inventory
    | 'create_po' | 'approve_po' | 'reject_po' | 'delete_po' | 'bulk_approve' | 'auto_restock'
    | 'adjust_stock' | 'transfer_stock' | 'create_product' | 'update_product' | 'delete_product'
    // Employee & HR
    | 'create_employee' | 'update_employee' | 'delete_employee' | 'assign_role' | 'process_payroll'
    // Customer Management
    | 'create_customer' | 'update_customer' | 'delete_customer' | 'add_loyalty_points'
    // Sales & Orders
    | 'create_sale' | 'refund_sale' | 'void_sale'
    // Warehouse Operations
    | 'assign_job' | 'complete_job' | 'create_job' | 'auto_assign_jobs'
    // Settings & Configuration
    | 'update_settings' | 'backup_data' | 'restore_data' | 'reset_system'
    // Reports & Analytics
    | 'generate_report' | 'export_data'
    // System Status
    | 'update_status' | 'unknown';

    params: Record<string, any>;
    description: string;
    affectedItems?: string[]; // List of items that will be affected
    estimatedCost?: number; // For PO operations
    requiresConfirmation?: boolean; // If true, show confirmation modal
}

export interface ActionResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

class AIActionExecutorService {
    /**
     * Execute an AI-suggested action
     */
    async executeAction(action: AIAction, userRole: string): Promise<ActionResult> {
        // Security: Only super admin can execute actions
        if (userRole !== 'super_admin') {
            return {
                success: false,
                message: 'Permission denied. Only super admin can execute AI actions.',
                error: 'PERMISSION_DENIED'
            };
        }

        try {
            switch (action.type) {
                case 'create_po':
                    return await this.createPurchaseOrder(action.params);

                case 'approve_po':
                    return await this.approvePurchaseOrder(action.params);

                case 'auto_restock':
                    return await this.autoRestockLowItems(action.params);

                case 'bulk_approve':
                    return await this.bulkApprovePOs(action.params);

                case 'adjust_stock':
                    return await this.adjustStock(action.params);

                case 'assign_job':
                    return await this.assignJob(action.params);

                default:
                    return {
                        success: false,
                        message: `Unknown action type: ${action.type}`,
                        error: 'UNKNOWN_ACTION'
                    };
            }
        } catch (error: any) {
            return {
                success: false,
                message: `Action failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Create a purchase order
     */
    private async createPurchaseOrder(params: any): Promise<ActionResult> {
        try {
            const { productId, quantity, supplierId, siteId } = params;

            if (!productId || !quantity || !supplierId || !siteId) {
                return {
                    success: false,
                    message: 'Missing required parameters: productId, quantity, supplierId, siteId',
                    error: 'MISSING_PARAMS'
                };
            }

            // Get product details
            const products = await productsService.getAll();
            const product = products.find((p: any) => p.id === productId);

            if (!product) {
                return {
                    success: false,
                    message: `Product not found: ${productId}`,
                    error: 'PRODUCT_NOT_FOUND'
                };
            }

            // Create PO
            const po = {
                site_id: siteId,
                supplier_id: supplierId,
                status: 'Draft',
                total_amount: product.cost_price * quantity,
                items_count: 1,
                line_items: [
                    {
                        product_id: productId,
                        product_name: product.name,
                        quantity: quantity,
                        unit_cost: product.cost_price,
                        total_cost: product.cost_price * quantity
                    }
                ],
                created_at: new Date().toISOString()
            };

            const createdPO = await purchaseOrdersService.create(po);

            return {
                success: true,
                message: `Purchase order created successfully for ${quantity} units of ${product.name}`,
                data: createdPO
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to create PO: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Adjust stock levels
     */
    private async adjustStock(params: any): Promise<ActionResult> {
        try {
            const { productId, adjustment, reason } = params;

            if (!productId || adjustment === undefined) {
                return {
                    success: false,
                    message: 'Missing required parameters: productId, adjustment',
                    error: 'MISSING_PARAMS'
                };
            }

            // Get product
            const products = await productsService.getAll();
            const product = products.find((p: any) => p.id === productId);

            if (!product) {
                return {
                    success: false,
                    message: `Product not found: ${productId}`,
                    error: 'PRODUCT_NOT_FOUND'
                };
            }

            // Update stock
            const newStock = product.stock + adjustment;
            await productsService.update(productId, { stock: newStock });

            return {
                success: true,
                message: `Stock adjusted for ${product.name}: ${product.stock} → ${newStock} (${adjustment > 0 ? '+' : ''}${adjustment})`,
                data: { productId, oldStock: product.stock, newStock, adjustment }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to adjust stock: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Assign a job to an employee
     */
    private async assignJob(params: any): Promise<ActionResult> {
        try {
            const { jobId, employeeId } = params;

            if (!jobId || !employeeId) {
                return {
                    success: false,
                    message: 'Missing required parameters: jobId, employeeId',
                    error: 'MISSING_PARAMS'
                };
            }

            // Get employee
            const employees = await employeesService.getAll();
            const employee = employees.find((e: any) => e.id === employeeId);

            if (!employee) {
                return {
                    success: false,
                    message: `Employee not found: ${employeeId}`,
                    error: 'EMPLOYEE_NOT_FOUND'
                };
            }

            // Update job assignment
            await wmsJobsService.update(jobId, { assigned_to: employee.name });

            return {
                success: true,
                message: `Job ${jobId} assigned to ${employee.name}`,
                data: { jobId, employeeId, employeeName: employee.name }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to assign job: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Approve a purchase order
     */
    private async approvePurchaseOrder(params: any): Promise<ActionResult> {
        try {
            const { poId } = params;

            if (!poId) {
                return {
                    success: false,
                    message: 'Missing required parameter: poId',
                    error: 'MISSING_PARAMS'
                };
            }

            // Get PO
            const pos = await purchaseOrdersService.getAll();
            const po = pos.find((p: any) => p.id === poId);

            if (!po) {
                return {
                    success: false,
                    message: `Purchase order not found: ${poId}`,
                    error: 'PO_NOT_FOUND'
                };
            }

            // Approve PO
            await purchaseOrdersService.update(poId, { status: 'Approved' });

            return {
                success: true,
                message: `Purchase order ${poId} approved successfully`,
                data: { poId, status: 'Approved' }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to approve PO: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Auto-create POs for low stock items
     */
    private async autoRestockLowItems(params: any): Promise<ActionResult> {
        try {
            const { threshold = 10, quantity = 50, siteId, supplierId = 'SUP-001' } = params;

            // Get all products
            const products = await productsService.getAll();

            // Filter low stock items
            const lowStockItems = products.filter((p: any) =>
                p.stock < threshold && (!siteId || p.siteId === siteId)
            );

            if (lowStockItems.length === 0) {
                return {
                    success: true,
                    message: 'No low stock items found',
                    data: { itemsProcessed: 0 }
                };
            }

            // Create POs for each low stock item
            const createdPOs = [];
            for (const product of lowStockItems) {
                const po = {
                    site_id: product.siteId || siteId,
                    supplier_id: supplierId,
                    status: 'Draft',
                    total_amount: product.cost_price * quantity,
                    items_count: 1,
                    line_items: [
                        {
                            product_id: product.id,
                            product_name: product.name,
                            quantity: quantity,
                            unit_cost: product.cost_price,
                            total_cost: product.cost_price * quantity
                        }
                    ],
                    created_at: new Date().toISOString()
                };

                const createdPO = await purchaseOrdersService.create(po);
                createdPOs.push(createdPO);
            }

            return {
                success: true,
                message: `Created ${createdPOs.length} purchase orders for low stock items`,
                data: {
                    itemsProcessed: lowStockItems.length,
                    posCreated: createdPOs.length,
                    items: lowStockItems.map((p: any) => p.name)
                }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to auto-restock: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Bulk approve multiple POs
     */
    private async bulkApprovePOs(params: any): Promise<ActionResult> {
        try {
            const { status = 'Draft', limit } = params;

            // Get all POs with specified status
            const pos = await purchaseOrdersService.getAll();
            let targetPOs = pos.filter((p: any) => p.status === status);

            if (limit) {
                targetPOs = targetPOs.slice(0, limit);
            }

            if (targetPOs.length === 0) {
                return {
                    success: true,
                    message: `No ${status} purchase orders found`,
                    data: { approved: 0 }
                };
            }

            // Approve all
            const approved = [];
            for (const po of targetPOs) {
                await purchaseOrdersService.update(po.id, { status: 'Approved' });
                approved.push(po.id);
            }

            return {
                success: true,
                message: `Approved ${approved.length} purchase orders`,
                data: {
                    approved: approved.length,
                    poIds: approved
                }
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Failed to bulk approve: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Parse natural language command into action
     */
    parseCommand(command: string): AIAction | null {
        const lowerCommand = command.toLowerCase();

        // Approve PO patterns
        if (lowerCommand.includes('approve') && (lowerCommand.includes('po') || lowerCommand.includes('purchase order'))) {
            // Check for bulk approve
            if (lowerCommand.includes('all') || lowerCommand.includes('bulk')) {
                return {
                    type: 'bulk_approve',
                    params: {},
                    description: 'Bulk approve all draft purchase orders'
                };
            }

            return {
                type: 'approve_po',
                params: this.extractPOParams(command),
                description: 'Approve a purchase order'
            };
        }

        // Auto-restock patterns
        if ((lowerCommand.includes('restock') || lowerCommand.includes('low stock')) &&
            (lowerCommand.includes('auto') || lowerCommand.includes('create'))) {
            const quantityMatch = command.match(/(\d+)\s*units?/i);
            const thresholdMatch = command.match(/below\s*(\d+)/i) || command.match(/under\s*(\d+)/i);

            return {
                type: 'auto_restock',
                params: {
                    quantity: quantityMatch ? parseInt(quantityMatch[1]) : 50,
                    threshold: thresholdMatch ? parseInt(thresholdMatch[1]) : 10
                },
                description: `Auto-create POs for items below ${thresholdMatch ? thresholdMatch[1] : 10} units`
            };
        }

        // Create PO patterns
        if (lowerCommand.includes('create') && (lowerCommand.includes('po') || lowerCommand.includes('purchase order'))) {
            return {
                type: 'create_po',
                params: this.extractPOParams(command),
                description: 'Create a purchase order'
            };
        }

        // Adjust stock patterns
        if (lowerCommand.includes('adjust') && lowerCommand.includes('stock')) {
            return {
                type: 'adjust_stock',
                params: this.extractStockParams(command),
                description: 'Adjust stock levels'
            };
        }

        // Assign job patterns
        if (lowerCommand.includes('assign') && lowerCommand.includes('job')) {
            return {
                type: 'assign_job',
                params: this.extractJobParams(command),
                description: 'Assign job to employee'
            };
        }

        return null;
    }

    /**
     * Extract PO parameters from command
     */
    private extractPOParams(command: string): Record<string, any> {
        // Simple extraction - can be enhanced with AI
        const params: Record<string, any> = {};

        // Extract quantity
        const quantityMatch = command.match(/(\d+)\s*units?/i);
        if (quantityMatch) {
            params.quantity = parseInt(quantityMatch[1]);
        }

        return params;
    }

    /**
     * Extract stock adjustment parameters
     */
    private extractStockParams(command: string): Record<string, any> {
        const params: Record<string, any> = {};

        // Extract adjustment amount
        const adjustmentMatch = command.match(/by\s*([+-]?\d+)/i);
        if (adjustmentMatch) {
            params.adjustment = parseInt(adjustmentMatch[1]);
        }

        return params;
    }

    /**
     * Extract job assignment parameters
     */
    private extractJobParams(command: string): Record<string, any> {
        return {};
    }
}

export const aiActionExecutorService = new AIActionExecutorService();

/**
 * Supabase API Service Layer
 * Complete CRUD operations for all entities
 */

import { supabase } from '../lib/supabase';
import type {
    Product,
    Customer,
    Employee,
    Supplier,
    PurchaseOrder,
    SaleRecord,
    StockMovement,
    ExpenseRecord,
    WMSJob,
    Site,
    TransferRecord
} from '../types';

// ============================================================================
// SITES
// ============================================================================

export const sitesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
            terminalCount: s.terminal_count,
            code: s.code || s.id.substring(0, 8).toUpperCase() // Use database code or fallback to short UUID
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            code: data.code || data.id.substring(0, 8).toUpperCase() // Use database code or fallback to short UUID
        };
    },

    async create(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>) {
        const dbSite = {
            name: site.name,
            type: site.type,
            address: site.address,
            status: site.status,
            manager: site.manager,
            capacity: site.capacity,
            terminal_count: site.terminalCount
        };
        const { data, error } = await supabase
            .from('sites')
            .insert(dbSite)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            code: data.id?.substring(0, 8).toUpperCase() || 'UNK' // Generate code from ID
        };
    },

    async update(id: string, updates: Partial<Site>) {
        const dbUpdates: any = { ...updates };
        // Remove fields that don't exist in the database
        delete dbUpdates.code; // code is generated from ID, not stored
        if (updates.terminalCount !== undefined) {
            dbUpdates.terminal_count = updates.terminalCount;
            delete dbUpdates.terminalCount;
        }

        const { data, error } = await supabase
            .from('sites')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            terminalCount: data.terminal_count,
            code: data.id?.substring(0, 8).toUpperCase() || 'UNK' // Generate code from ID
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('sites')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// PRODUCTS
// ============================================================================

export const productsService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => ({
            ...p,
            siteId: p.site_id,
            costPrice: p.cost_price,
            salePrice: p.sale_price,
            isOnSale: p.is_on_sale,
            expiryDate: p.expiry_date,
            batchNumber: p.batch_number,
            shelfPosition: p.shelf_position,
            competitorPrice: p.competitor_price,
            salesVelocity: p.sales_velocity,
            posReceivedAt: p.pos_received_at,
            pos_received_at: p.pos_received_at,
            posReceivedBy: p.pos_received_by,
            pos_received_by: p.pos_received_by
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by
        };
    },

    async getBySKU(sku: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by
        };
    },

    async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
        const dbProduct = {
            site_id: product.siteId,
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price,
            cost_price: product.costPrice,
            sale_price: product.salePrice,
            is_on_sale: product.isOnSale,
            stock: product.stock,
            status: product.status,
            location: product.location,
            expiry_date: product.expiryDate,
            batch_number: product.batchNumber,
            shelf_position: product.shelfPosition,
            competitor_price: product.competitorPrice,
            sales_velocity: product.salesVelocity,
            image: product.image
        };
        const { data, error } = await supabase
            .from('products')
            .insert(dbProduct)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at
        };
    },

    async update(id: string, updates: Partial<Product>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.costPrice !== undefined) { dbUpdates.cost_price = updates.costPrice; delete dbUpdates.costPrice; }
        if (updates.salePrice !== undefined) { dbUpdates.sale_price = updates.salePrice; delete dbUpdates.salePrice; }
        if (updates.isOnSale !== undefined) { dbUpdates.is_on_sale = updates.isOnSale; delete dbUpdates.isOnSale; }
        if (updates.expiryDate !== undefined) { dbUpdates.expiry_date = updates.expiryDate; delete dbUpdates.expiryDate; }
        if (updates.batchNumber !== undefined) { dbUpdates.batch_number = updates.batchNumber; delete dbUpdates.batchNumber; }
        if (updates.shelfPosition !== undefined) { dbUpdates.shelf_position = updates.shelfPosition; delete dbUpdates.shelfPosition; }
        if (updates.competitorPrice !== undefined) { dbUpdates.competitor_price = updates.competitorPrice; delete dbUpdates.competitorPrice; }
        if (updates.salesVelocity !== undefined) { dbUpdates.sales_velocity = updates.salesVelocity; delete dbUpdates.salesVelocity; }
        if (updates.posReceivedAt !== undefined) { dbUpdates.pos_received_at = updates.posReceivedAt; delete dbUpdates.posReceivedAt; }
        if (updates.pos_received_at !== undefined) { dbUpdates.pos_received_at = updates.pos_received_at; }
        if (updates.posReceivedBy !== undefined) { dbUpdates.pos_received_by = updates.posReceivedBy; delete dbUpdates.posReceivedBy; }
        if (updates.pos_received_by !== undefined) { dbUpdates.pos_received_by = updates.pos_received_by; }

        const { data, error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            costPrice: data.cost_price,
            salePrice: data.sale_price,
            isOnSale: data.is_on_sale,
            expiryDate: data.expiry_date,
            batchNumber: data.batch_number,
            shelfPosition: data.shelf_position,
            competitorPrice: data.competitor_price,
            salesVelocity: data.sales_velocity,
            posReceivedAt: data.pos_received_at,
            pos_received_at: data.pos_received_at,
            posReceivedBy: data.pos_received_by,
            pos_received_by: data.pos_received_by
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT') {
        // Get current stock
        const product = await this.getById(productId);

        // Calculate new stock
        const newStock = type === 'OUT'
            ? product.stock - quantity
            : product.stock + quantity;

        // Update product
        const updated = await this.update(productId, { stock: newStock });

        // Create stock movement record
        await stockMovementsService.create({
            site_id: product.site_id,
            product_id: productId,
            product_name: product.name,
            type,
            quantity,
            movement_date: new Date().toISOString(),
            performed_by: 'System',
            reason: `Stock ${type.toLowerCase()}`
        } as any);

        return updated;
    },

    async getLowStock(threshold: number = 10, siteId?: string) {
        let query = supabase
            .from('products')
            .select('*')
            .lte('stock', threshold)
            .order('stock', { ascending: true });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

// ============================================================================
// CUSTOMERS
// ============================================================================

export const customersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((c: any) => ({
            ...c,
            loyaltyPoints: c.loyalty_points || 0,
            totalSpent: c.total_spent || 0,
            lastVisit: c.last_visit
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async getByPhone(phone: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async create(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) {
        const dbCustomer = {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            loyalty_points: customer.loyaltyPoints,
            total_spent: customer.totalSpent,
            last_visit: customer.lastVisit,
            tier: customer.tier,
            notes: customer.notes
        };
        const { data, error } = await supabase
            .from('customers')
            .insert(dbCustomer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async update(id: string, updates: Partial<Customer>) {
        const dbUpdates: any = { ...updates };
        if (updates.loyaltyPoints !== undefined) {
            dbUpdates.loyalty_points = updates.loyaltyPoints;
            delete dbUpdates.loyaltyPoints;
        }
        if (updates.totalSpent !== undefined) {
            dbUpdates.total_spent = updates.totalSpent;
            delete dbUpdates.totalSpent;
        }
        if (updates.lastVisit !== undefined) {
            dbUpdates.last_visit = updates.lastVisit;
            delete dbUpdates.lastVisit;
        }

        const { data, error } = await supabase
            .from('customers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            loyaltyPoints: data.loyalty_points || 0,
            totalSpent: data.total_spent || 0,
            lastVisit: data.last_visit
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateLoyaltyPoints(id: string, points: number) {
        const customer = await this.getById(id);
        return await this.update(id, {
            loyalty_points: customer.loyalty_points + points
        });
    },

    async updateTier(id: string, tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') {
        return await this.update(id, { tier });
    }
};

// ============================================================================
// EMPLOYEES
// ============================================================================

export const employeesService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('employees')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            joinDate: e.join_date,
            performanceScore: e.performance_score,
            attendanceRate: e.attendance_rate
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async create(employee: Omit<Employee, 'created_at' | 'updated_at'>) {
        const dbEmployee = {
            id: employee.id,
            code: employee.code,
            site_id: employee.siteId,
            name: employee.name,
            role: employee.role,
            email: employee.email,
            phone: employee.phone,
            status: employee.status,
            join_date: employee.joinDate,
            department: employee.department,
            avatar: employee.avatar,
            performance_score: employee.performanceScore,
            specialization: employee.specialization,
            salary: employee.salary,
            badges: employee.badges,
            attendance_rate: employee.attendanceRate
        };
        const { data, error } = await supabase
            .from('employees')
            .insert(dbEmployee)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async update(id: string, updates: Partial<Employee>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.joinDate !== undefined) { dbUpdates.join_date = updates.joinDate; delete dbUpdates.joinDate; }
        if (updates.performanceScore !== undefined) { dbUpdates.performance_score = updates.performanceScore; delete dbUpdates.performanceScore; }
        if (updates.attendanceRate !== undefined) { dbUpdates.attendance_rate = updates.attendanceRate; delete dbUpdates.attendanceRate; }

        const { data, error } = await supabase
            .from('employees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            joinDate: data.join_date,
            performanceScore: data.performance_score,
            attendanceRate: data.attendance_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
            leadTime: s.lead_time,
            taxId: s.tax_id,
            nationalId: s.national_id
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) {
        const dbSupplier = {
            name: supplier.name,
            type: supplier.type,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            category: supplier.category,
            status: supplier.status,
            rating: supplier.rating,
            lead_time: supplier.leadTime,
            tax_id: supplier.taxId,
            national_id: supplier.nationalId,
            location: supplier.location
        };
        const { data, error } = await supabase
            .from('suppliers')
            .insert(dbSupplier)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async update(id: string, updates: Partial<Supplier>) {
        const dbUpdates: any = { ...updates };
        if (updates.leadTime !== undefined) { dbUpdates.lead_time = updates.leadTime; delete dbUpdates.leadTime; }
        if (updates.taxId !== undefined) { dbUpdates.tax_id = updates.taxId; delete dbUpdates.taxId; }
        if (updates.nationalId !== undefined) { dbUpdates.national_id = updates.nationalId; delete dbUpdates.nationalId; }

        const { data, error } = await supabase
            .from('suppliers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            leadTime: data.lead_time,
            taxId: data.tax_id,
            nationalId: data.national_id
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export const purchaseOrdersService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('purchase_orders')
            .select('*, po_items(*)')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => {
            // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
            let approvedBy = null;
            let approvedAt = null;
            let notes = p.notes;

            const approvalMatch = p.notes ? p.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
            if (approvalMatch) {
                approvedBy = approvalMatch[1];
                approvedAt = approvalMatch[2];
            }

            // Reverse map status: Pending without approval = Draft
            let frontendStatus = p.status;
            if (p.status === 'Pending' && !approvedBy) {
                frontendStatus = 'Draft';
            } else if (p.status === 'Pending' && approvedBy) {
                frontendStatus = 'Approved';
            }

            return {
                ...p,
                status: frontendStatus,
                approvedBy,
                approvedAt,
                notes,
                siteId: p.site_id,
                supplierId: p.supplier_id,
                supplierName: p.supplier_name,
                totalAmount: p.total_amount,
                itemsCount: p.items_count,
                expectedDelivery: p.expected_delivery,
                shippingCost: p.shipping_cost,
                taxAmount: p.tax_amount,
                paymentTerms: p.payment_terms,
                tempReq: p.temp_req,
                shelfLife: p.shelf_life,
                dockSlot: p.dock_slot,
                poNumber: p.po_number,
                lineItems: p.po_items.map((i: any) => ({
                    ...i,
                    productId: i.product_id,
                    productName: i.product_name,
                    unitCost: i.unit_cost,
                    totalCost: i.total_cost
                }))
            };
        });
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*, po_items(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Parse approval info from notes (stored as [APPROVED_BY:name:date] tag)
        let approvedBy = null;
        let approvedAt = null;
        let notes = data.notes;

        const approvalMatch = data.notes ? data.notes.match(/\[APPROVED_BY:(.*?):(.*?)]/) : null;
        if (approvalMatch) {
            approvedBy = approvalMatch[1];
            approvedAt = approvalMatch[2];
        }

        // Reverse map status: Pending without approval = Draft
        let frontendStatus = data.status;
        if (data.status === 'Pending' && !approvedBy) {
            frontendStatus = 'Draft';
        } else if (data.status === 'Pending' && approvedBy) {
            frontendStatus = 'Approved';
        }

        return {
            ...data,
            status: frontendStatus,
            approvedBy,
            approvedAt,
            notes,
            siteId: data.site_id,
            supplierId: data.supplier_id,
            supplierName: data.supplier_name,
            totalAmount: data.total_amount,
            itemsCount: data.items_count,
            expectedDelivery: data.expected_delivery,
            shippingCost: data.shipping_cost,
            taxAmount: data.tax_amount,
            paymentTerms: data.payment_terms,
            tempReq: data.temp_req,
            shelfLife: data.shelf_life,
            dockSlot: data.dock_slot,
            poNumber: data.po_number,
            lineItems: data.po_items.map((i: any) => ({
                ...i,
                productId: i.product_id,
                productName: i.product_name,
                unitCost: i.unit_cost,
                totalCost: i.total_cost
            }))
        };
    },

    async create(po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: any[]) {
        // Generate UUID client-side
        const poId = crypto.randomUUID();

        // Map frontend statuses to database-compatible values
        // Database only allows: 'Pending', 'Received', 'Cancelled'
        // Frontend uses: 'Draft', 'Pending', 'Approved', 'Received', 'Cancelled'
        const dbStatus = po.status === 'Draft' ? 'Pending' :
            po.status === 'Approved' ? 'Pending' :
                po.status;

        // Generate simple sequential PO number if not provided
        let poNumber = po.poNumber;
        if (!poNumber) {
            try {
                // Get the highest existing PO number
                const { data: existingPOs, error: fetchError } = await supabase
                    .from('purchase_orders')
                    .select('po_number')
                    .not('po_number', 'is', null)
                    .order('po_number', { ascending: false })
                    .limit(1);

                let nextNumber = 1;
                if (!fetchError && existingPOs && existingPOs.length > 0) {
                    // Extract number from existing PO (e.g., "PO-0001" -> 1, "PO-1234" -> 1234)
                    const lastPONumber = existingPOs[0].po_number;
                    const match = lastPONumber?.match(/(?:PO|PR)-(\d+)/i);
                    if (match) {
                        nextNumber = parseInt(match[1], 10) + 1;
                    }
                }

                // Format as PO-0001, PO-0002, etc. (4 digits, zero-padded)
                const prefix = po.notes?.includes('[PR]') ? 'PR' : 'PO';
                poNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
            } catch (error) {
                // Fallback: use timestamp if sequential generation fails
                console.warn('Failed to generate sequential PO number, using timestamp fallback:', error);
                const prefix = po.notes?.includes('[PR]') ? 'PR' : 'PO';
                poNumber = `${prefix}-${Date.now()}`;
            }
        }

        // Create PO
        const dbPO = {
            id: poId,
            site_id: po.siteId,
            supplier_id: po.supplierId === 'UNSPECIFIED' ? null : po.supplierId, // Convert UNSPECIFIED to null
            supplier_name: po.supplierName,
            order_date: po.date,
            status: dbStatus, // Use mapped status
            total_amount: po.totalAmount,
            items_count: po.itemsCount,
            expected_delivery: po.expectedDelivery,
            shipping_cost: po.shippingCost,
            tax_amount: po.taxAmount,
            notes: po.notes,
            payment_terms: po.paymentTerms,
            incoterms: po.incoterms,
            destination: po.destination,
            discount: po.discount,
            temp_req: po.tempReq,
            shelf_life: po.shelfLife,
            dock_slot: po.dockSlot,
            po_number: poNumber
            // Note: approval tracking is handled via notes field (see update function)
        };
        const { error: poError } = await supabase
            .from('purchase_orders')
            .insert(dbPO);

        if (poError) throw poError;

        // Create PO items
        const itemsWithPOId = items.map(item => {
            // Check if productId is a valid UUID (starts with hex chars and has dashes)
            // If it's a custom ID like "CUSTOM-xxx", set to null
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId);

            return {
                po_id: poId,
                product_id: isValidUUID ? item.productId : null, // Set to null for custom IDs
                product_name: item.productName,
                quantity: item.quantity,
                unit_cost: item.unitCost,
                total_cost: item.totalCost
            };
        });

        const { error: itemsError } = await supabase
            .from('po_items')
            .insert(itemsWithPOId);

        if (itemsError) {
            console.error('PO Items Insert Error:', itemsError);
            throw new Error(`PO Items Insert Failed: ${itemsError.message} (PO ID: ${poId})`);
        }

        return await this.getById(poId);
    },

    async update(id: string, updates: Partial<PurchaseOrder>) {
        // Start with an empty object and only add fields that should be updated
        const dbUpdates: any = {};

        // Handle Approval: When status is 'Approved', save as 'Pending' with approval tag in notes
        if (updates.status === 'Approved' || updates.approvedBy) {
            // 1. Fetch current PO to get existing notes
            const { data: currentPO } = await supabase
                .from('purchase_orders')
                .select('notes')
                .eq('id', id)
                .single();

            const currentNotes = currentPO?.notes || '';

            // Check if already approved (avoid duplicate tags)
            const alreadyApproved = currentNotes?.includes('[APPROVED_BY:');

            if (!alreadyApproved) {
                const approvalTag = `\n[APPROVED_BY:${updates.approvedBy || 'System'}:${updates.approvedAt || new Date().toISOString()}]`;
                // 2. Append to notes
                dbUpdates.notes = currentNotes + approvalTag;
            }

            // 3. Set status to 'Pending' (which maps to 'Approved' in frontend when approvedBy exists)
            dbUpdates.status = 'Pending';
        } else if (updates.status === 'Cancelled') {
            // Handle Rejection: When status is 'Cancelled', keep it as 'Cancelled'
            dbUpdates.status = 'Cancelled';
        } else if (updates.status) {
            // Map other statuses
            const statusStr = String(updates.status);
            const mappedStatus: string = statusStr === 'Draft' ? 'Pending' :
                statusStr === 'Approved' ? 'Pending' :
                    statusStr;
            dbUpdates.status = mappedStatus;
        }

        // Map camelCase to snake_case for other fields (only if they exist in updates)
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; }
        if (updates.supplierId !== undefined) { dbUpdates.supplier_id = updates.supplierId === 'UNSPECIFIED' ? null : updates.supplierId; }
        if (updates.supplierName !== undefined) { dbUpdates.supplier_name = updates.supplierName; }
        if (updates.totalAmount !== undefined) { dbUpdates.total_amount = updates.totalAmount; }
        if (updates.itemsCount !== undefined) { dbUpdates.items_count = updates.itemsCount; }
        if (updates.expectedDelivery !== undefined) { dbUpdates.expected_delivery = updates.expectedDelivery; }
        if (updates.shippingCost !== undefined) { dbUpdates.shipping_cost = updates.shippingCost; }
        if (updates.taxAmount !== undefined) { dbUpdates.tax_amount = updates.taxAmount; }
        if (updates.paymentTerms !== undefined) { dbUpdates.payment_terms = updates.paymentTerms; }
        if (updates.tempReq !== undefined) { dbUpdates.temp_req = updates.tempReq; }
        if (updates.shelfLife !== undefined) { dbUpdates.shelf_life = updates.shelfLife; }
        if (updates.dockSlot !== undefined) { dbUpdates.dock_slot = updates.dockSlot; }
        if (updates.createdBy !== undefined) { dbUpdates.created_by = updates.createdBy; }
        if (updates.poNumber !== undefined) { dbUpdates.po_number = updates.poNumber; }
        if (updates.notes !== undefined && !dbUpdates.notes) { dbUpdates.notes = updates.notes; }
        if (updates.date !== undefined) { dbUpdates.order_date = updates.date; }
        if (updates.destination !== undefined) { dbUpdates.destination = updates.destination; }
        if (updates.discount !== undefined) { dbUpdates.discount = updates.discount; }
        if (updates.incoterms !== undefined) { dbUpdates.incoterms = updates.incoterms; }

        // Remove any undefined values
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });

        const { data, error } = await supabase
            .from('purchase_orders')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('PO Update Error:', error);
            console.error('Update payload:', dbUpdates);
            throw error;
        }

        // Return the updated PO with proper mapping
        return await this.getById(id);
    },

    async receive(id: string) {
        // Update PO status to Received
        // NOTE: Stock is NOT adjusted here. Stock is added during the PUTAWAY process
        // in WarehouseOperations.tsx when items are physically scanned and placed in storage.
        // This prevents double-counting inventory.
        await this.update(id, { status: 'Received' });

        // Return the updated PO
        const po = await this.getById(id);
        return po;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SALES
// ============================================================================

export const salesService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('sales')
            .select('*, sale_items(*), customers(*)')
            .order('sale_date', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((s: any) => ({
            ...s,
            siteId: s.site_id,
            date: s.sale_date,
            method: s.payment_method,
            amountTendered: s.amount_tendered,
            cashierName: s.cashier_name,
            customerId: s.customer_id,
            items: s.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price
            })),
            receiptNumber: s.receipt_number
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*), customers(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            items: data.sale_items.map((i: any) => ({
                ...i,
                id: i.product_id,
                name: i.product_name,
                costPrice: i.cost_price
            }))
        };
    },

    async create(sale: Omit<SaleRecord, 'id' | 'created_at' | 'updated_at'>, items: any[]) {
        // Create sale
        const dbSale = {
            site_id: sale.siteId,
            customer_id: sale.customerId,
            sale_date: sale.date || new Date().toISOString(),
            subtotal: sale.subtotal,
            tax: sale.tax,
            total: sale.total,
            payment_method: sale.method,
            status: sale.status,
            amount_tendered: sale.amountTendered,
            change: sale.change,
            cashier_name: sale.cashierName,
            receipt_number: (sale as any).receiptNumber // Will be populated below if not present
        };

        // Generate sequential Receipt Number if not provided
        if (!(dbSale as any).receipt_number) {
            try {
                const { data: existingSales, error: fetchError } = await supabase
                    .from('sales')
                    .select('receipt_number')
                    .not('receipt_number', 'is', null)
                    .order('receipt_number', { ascending: false })
                    .limit(1);

                let nextNumber = 1;
                if (!fetchError && existingSales && existingSales.length > 0) {
                    const lastNum = existingSales[0].receipt_number;
                    const match = lastNum?.match(/REC-(\d+)/i);
                    if (match) {
                        nextNumber = parseInt(match[1], 10) + 1;
                    }
                }
                (dbSale as any).receipt_number = `REC-${String(nextNumber).padStart(4, '0')}`;
            } catch (error) {
                console.warn('Failed to generate sequential Receipt Number:', error);
                (dbSale as any).receipt_number = `REC-${Date.now()}`;
            }
        }

        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(dbSale)
            .select()
            .single();

        if (saleError) throw saleError;

        // Create sale items
        const itemsWithSaleId = items.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            cost_price: item.costPrice
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(itemsWithSaleId);

        if (itemsError) throw itemsError;

        // NOTE: Stock is NOT deducted here. Stock is deducted during the PICK process
        // in WarehouseOperations.tsx when items are physically picked from shelves.
        // This is proper WMS flow: Sale → PICK Job → Physical Pick → Stock Deducted

        // Update customer if provided
        if ((sale as any).customer_id) {
            const customerId = (sale as any).customer_id;
            const customer = await customersService.getById(customerId);
            await customersService.update(customerId, {
                total_spent: (customer.totalSpent || 0) + sale.total,
                last_visit: new Date().toISOString().split('T')[0]
            } as any);
        }

        return {
            ...saleData,
            id: saleData.id,
            siteId: saleData.site_id,
            customerId: saleData.customer_id,
            date: saleData.sale_date,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            method: saleData.payment_method,
            status: saleData.status,
            amountTendered: saleData.amount_tendered,
            change: saleData.change,
            cashierName: saleData.cashier_name,
            receiptNumber: saleData.receipt_number,
            items: itemsWithSaleId.map(i => ({
                id: i.product_id,
                name: i.product_name,
                quantity: i.quantity,
                price: i.price,
                costPrice: i.cost_price
            }))
        };
    },

    async refund(id: string, items: any[], refundAmount: number) {
        // Update sale status
        await supabase
            .from('sales')
            .update({ status: 'Refunded' })
            .eq('id', id);

        // Restore stock for refunded items
        for (const item of items) {
            await productsService.adjustStock(item.product_id, item.quantity, 'IN');
        }

        return true;
    },

    async update(id: string, updates: Partial<SaleRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.fulfillmentStatus !== undefined) {
            dbUpdates.fulfillment_status = updates.fulfillmentStatus;
            delete dbUpdates.fulfillmentStatus;
        }

        const { data, error } = await supabase
            .from('sales')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.sale_date,
            method: data.payment_method,
            amountTendered: data.amount_tendered,
            cashierName: data.cashier_name,
            customerId: data.customer_id,
            fulfillmentStatus: data.fulfillment_status
        };
    },

    async getTodaySales(siteId?: string) {
        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('sales')
            .select('*')
            .gte('sale_date', today);

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const stockMovementsService = {
    async getAll(siteId?: string, productId?: string) {
        let query = supabase
            .from('stock_movements')
            .select('*')
            .order('movement_date', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((m: any) => ({
            ...m,
            siteId: m.site_id,
            productId: m.product_id,
            productName: m.product_name,
            movementDate: m.movement_date,
            performedBy: m.performed_by,
            batchNumber: m.batch_number
        }));
    },

    async create(movement: Omit<StockMovement, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('stock_movements')
            .insert(movement)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================================================
// EXPENSES
// ============================================================================

export const expensesService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((e: any) => ({
            ...e,
            siteId: e.site_id,
            date: e.expense_date,
            approvedBy: e.approved_by
        }));
    },

    async create(expense: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>) {
        const dbExpense = {
            site_id: expense.siteId,
            expense_date: expense.date,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            status: expense.status,
            approved_by: expense.approvedBy
        };
        const { data, error } = await supabase
            .from('expenses')
            .insert(dbExpense)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async update(id: string, updates: Partial<ExpenseRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.date !== undefined) { dbUpdates.expense_date = updates.date; delete dbUpdates.date; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }

        const { data, error } = await supabase
            .from('expenses')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            date: data.expense_date,
            approvedBy: data.approved_by
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// WMS JOBS
// ============================================================================

export const wmsJobsService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('wms_jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((j: any) => ({
            ...j,
            siteId: j.site_id,
            items: j.items_count,
            assignedTo: j.assigned_to,
            orderRef: j.order_ref,
            lineItems: j.line_items || [],
            jobNumber: j.job_number,
            sourceSiteId: j.source_site_id,
            destSiteId: j.dest_site_id,
            transferStatus: j.transfer_status,
            requestedBy: j.requested_by,
            approvedBy: j.approved_by,
            shippedAt: j.shipped_at,
            receivedAt: j.received_at
        }));
    },

    async create(job: Omit<WMSJob, 'id' | 'created_at' | 'updated_at'>) {
        const dbJob = {
            site_id: job.siteId,
            type: job.type,
            priority: job.priority,
            status: job.status,
            items_count: job.items,
            assigned_to: job.assignedTo,
            location: job.location,
            order_ref: job.orderRef,
            line_items: job.lineItems,
            source_site_id: job.sourceSiteId,
            dest_site_id: job.destSiteId,
            transfer_status: job.transferStatus,
            requested_by: job.requestedBy,
            approved_by: job.approvedBy,
            job_number: (job as any).jobNumber // Will be populated below if not present
        };

        // Generate sequential Job Number if not provided
        if (!(dbJob as any).job_number) {
            try {
                // Query ALL jobs globally to get the highest number for this type
                // This ensures unique job numbers across all sites
                const typePrefix = dbJob.type === 'TRANSFER' ? 'TRF' :
                    dbJob.type === 'PICK' ? 'PK' :
                        dbJob.type === 'PACK' ? 'PA' :
                            dbJob.type === 'PUTAWAY' ? 'PU' :
                                dbJob.type === 'DISPATCH' ? 'DS' : 'JB';

                const { data: existingJobs, error: fetchError } = await supabase
                    .from('wms_jobs')
                    .select('job_number')
                    .eq('type', dbJob.type)
                    .not('job_number', 'is', null)
                    .ilike('job_number', `${typePrefix}-%`)
                    .order('created_at', { ascending: false })
                    .limit(1);

                let nextNumber = 1;
                if (!fetchError && existingJobs && existingJobs.length > 0) {
                    const lastNum = existingJobs[0].job_number;
                    // Extract number from format like "PK-0001"
                    const match = lastNum?.match(/-(\d+)$/);
                    if (match) {
                        nextNumber = parseInt(match[1], 10) + 1;
                    }
                }

                // Simple, clean job number format: PREFIX-nnnn
                (dbJob as any).job_number = `${typePrefix}-${String(nextNumber).padStart(4, '0')}`;
            } catch (error) {
                console.warn('Failed to generate sequential Job Number:', error);
                // Fallback: Use a short timestamp-based ID
                const shortId = Date.now().toString(36).toUpperCase().slice(-6);
                (dbJob as any).job_number = `JB-${shortId}`;
            }
        }

        console.log('📤 Inserting WMS Job:', dbJob);

        const { data, error } = await supabase
            .from('wms_jobs')
            .insert(dbJob)
            .select()
            .single();

        if (error) {
            console.error('❌ WMS Job Insert Error:', error);
            console.error('❌ Error Details:', JSON.stringify(error, null, 2));
            throw error;
        }

        console.log('✅ WMS Job Created:', data);
        return {
            ...data,
            siteId: data.site_id,
            items: data.items_count,
            assignedTo: data.assigned_to,
            orderRef: data.order_ref,
            lineItems: data.line_items || [],
            jobNumber: data.job_number,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            transferStatus: data.transfer_status,
            requestedBy: data.requested_by,
            approvedBy: data.approved_by,
            shippedAt: data.shipped_at,
            receivedAt: data.received_at
        };
    },

    async update(id: string, updates: Partial<WMSJob>) {
        const dbUpdates: any = { ...updates };
        if (updates.siteId !== undefined) { dbUpdates.site_id = updates.siteId; delete dbUpdates.siteId; }
        if (updates.items !== undefined) { dbUpdates.items_count = updates.items; delete dbUpdates.items; }
        if (updates.assignedTo !== undefined) { dbUpdates.assigned_to = updates.assignedTo; delete dbUpdates.assignedTo; }
        if (updates.orderRef !== undefined) { dbUpdates.order_ref = updates.orderRef; delete dbUpdates.orderRef; }
        if (updates.lineItems !== undefined) { dbUpdates.line_items = updates.lineItems; delete dbUpdates.lineItems; }
        if (updates.transferStatus !== undefined) { dbUpdates.transfer_status = updates.transferStatus; delete dbUpdates.transferStatus; }
        if (updates.approvedBy !== undefined) { dbUpdates.approved_by = updates.approvedBy; delete dbUpdates.approvedBy; }
        if (updates.shippedAt !== undefined) { dbUpdates.shipped_at = updates.shippedAt; delete dbUpdates.shippedAt; }
        if (updates.receivedAt !== undefined) { dbUpdates.received_at = updates.receivedAt; delete dbUpdates.receivedAt; }

        const { data, error } = await supabase
            .from('wms_jobs')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            siteId: data.site_id,
            items: data.items_count,
            assignedTo: data.assigned_to,
            orderRef: data.order_ref,
            lineItems: data.line_items || [],
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            transferStatus: data.transfer_status,
            requestedBy: data.requested_by,
            approvedBy: data.approved_by,
            shippedAt: data.shipped_at,
            receivedAt: data.received_at
        };
    },

    async complete(id: string) {
        return await this.update(id, { status: 'Completed' });
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('wms_jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// SYSTEM LOGS
// ============================================================================

// ============================================================================
// TRANSFERS
// ============================================================================

export const transfersService = {
    async getAll(siteId?: string) {
        let query = supabase
            .from('transfers')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteId) {
            // Get transfers where site is source OR destination
            query = query.or(`source_site_id.eq.${siteId},dest_site_id.eq.${siteId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            sourceSiteId: t.source_site_id,
            destSiteId: t.dest_site_id,
            status: t.status,
            date: t.transfer_date,
            items: t.items,
            sourceSiteName: 'Loading...',
            destSiteName: 'Loading...'
        }));
    },

    async create(transfer: Omit<TransferRecord, 'id' | 'sourceSiteName' | 'destSiteName'>) {
        const dbTransfer = {
            source_site_id: transfer.sourceSiteId,
            dest_site_id: transfer.destSiteId,
            status: transfer.status,
            transfer_date: transfer.date,
            items: transfer.items
        };

        const { data, error } = await supabase
            .from('transfers')
            .insert(dbTransfer)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date
        };
    },

    async update(id: string, updates: Partial<TransferRecord>) {
        const dbUpdates: any = { ...updates };
        if (updates.status) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('transfers')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            sourceSiteId: data.source_site_id,
            destSiteId: data.dest_site_id,
            date: data.transfer_date
        };
    }
};

// ============================================================================
// SYSTEM LOGS
// ============================================================================

export const systemLogsService = {
    async create(log: {
        user_name: string;
        action: string;
        details?: string;
        module: string;
        ip_address?: string;
    }) {
        const { data, error } = await supabase
            .from('system_logs')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getAll(module?: string) {
        let query = supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data.map((l: any) => ({
            ...l,
            userName: l.user_name,
            ip: l.ip_address
        }));
    }
};

// ============================================================================
// JOB ASSIGNMENTS
// ============================================================================

export const jobAssignmentsService = {
    async getAll(siteId?: string, employeeId?: string) {
        let query = supabase
            .from('job_assignments')
            .select(`
                *,
                wms_jobs!inner(site_id, type, priority, status, location, order_ref)
            `)
            .order('assigned_at', { ascending: false });

        if (siteId) {
            query = query.eq('wms_jobs.site_id', siteId);
        }

        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async getByJobId(jobId: string) {
        const { data, error } = await supabase
            .from('job_assignments')
            .select('*')
            .eq('job_id', jobId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;
        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async getByEmployeeId(employeeId: string, status?: string) {
        let query = supabase
            .from('job_assignments')
            .select('*')
            .eq('employee_id', employeeId)
            .order('assigned_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((a: any) => ({
            ...a,
            jobId: a.job_id,
            employeeId: a.employee_id,
            employeeName: a.employee_name,
            assignedAt: a.assigned_at,
            startedAt: a.started_at,
            completedAt: a.completed_at,
            estimatedDuration: a.estimated_duration,
            actualDuration: a.actual_duration,
            unitsProcessed: a.units_processed,
            accuracyRate: a.accuracy_rate
        }));
    },

    async create(assignment: any) {
        const dbAssignment = {
            job_id: assignment.jobId,
            employee_id: assignment.employeeId,
            employee_name: assignment.employeeName,
            assigned_at: assignment.assignedAt || new Date().toISOString(),
            status: assignment.status || 'Assigned',
            notes: assignment.notes,
            estimated_duration: assignment.estimatedDuration
        };

        const { data, error } = await supabase
            .from('job_assignments')
            .insert(dbAssignment)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async update(id: string, updates: any) {
        const dbUpdates: any = {};

        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.unitsProcessed !== undefined) dbUpdates.units_processed = updates.unitsProcessed;
        if (updates.accuracyRate !== undefined) dbUpdates.accuracy_rate = updates.accuracyRate;

        const { data, error } = await supabase
            .from('job_assignments')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            jobId: data.job_id,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            assignedAt: data.assigned_at,
            startedAt: data.started_at,
            completedAt: data.completed_at,
            estimatedDuration: data.estimated_duration,
            actualDuration: data.actual_duration,
            unitsProcessed: data.units_processed,
            accuracyRate: data.accuracy_rate
        };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('job_assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper: Get active assignments for an employee
    async getActiveAssignments(employeeId: string) {
        return this.getByEmployeeId(employeeId, 'In-Progress');
    },

    // Helper: Get employee performance metrics
    async getEmployeeMetrics(employeeId: string) {
        const { data, error } = await supabase
            .from('employee_performance_metrics')
            .select('*')
            .eq('employee_id', employeeId)
            .single();

        if (error) {
            // View might not exist or no data
            return null;
        }

        return {
            ...data,
            employeeId: data.employee_id,
            employeeName: data.employee_name,
            totalJobs: data.total_jobs,
            completedJobs: data.completed_jobs,
            avgDurationMinutes: data.avg_duration_minutes,
            avgAccuracyRate: data.avg_accuracy_rate,
            totalUnitsProcessed: data.total_units_processed,
            lastCompletedAt: data.last_completed_at
        };
    }
};

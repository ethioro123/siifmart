import { useEffect } from 'react';
import { realtimeService } from '../../services/realtime.service';
import { salesService, purchaseOrdersService } from '../../services/supabase.service';
import { mapShiftRow } from '../../services/shifts.service';
import type { Product, SaleRecord, Customer, PurchaseOrder, ShiftRecord } from '../../types';
import { logger } from '../../utils/logger';

interface UseRealtimeUpdatesProps {
  activeSiteId: string;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setShifts?: React.Dispatch<React.SetStateAction<ShiftRecord[]>>;
}

export function useRealtimeUpdates({
  activeSiteId,
  setProducts,
  setAllProducts,
  setSales,
  setCustomers,
  setOrders,
  setShifts
}: UseRealtimeUpdatesProps) {
  useEffect(() => {
    if (!activeSiteId) return;

    logger.debug('useRealtimeUpdates', `📡 Subscribing to real-time updates for site: ${activeSiteId}`);

    const mapRealtimeProduct = (data: any): Product => ({
      ...data,
      siteId: data.site_id,
      barcodes: data.barcodes || [],
      costPrice: data.cost_price,
      salePrice: data.sale_price,
      isOnSale: data.is_on_sale,
      expiryDate: data.expiry_date,
      batchNumber: data.batch_number,
      shelfPosition: data.shelf_position,
      competitorPrice: data.competitor_price,
      salesVelocity: data.sales_velocity,
      posReceivedAt: data.pos_received_at,
      posReceivedBy: data.pos_received_by,
      approvalStatus: data.approval_status,
      createdBy: data.created_by,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      rejectedBy: data.rejected_by,
      rejectedAt: data.rejected_at,
      rejectionReason: data.rejection_reason,
      priceUpdatedAt: data.price_updated_at,
      packQuantity: data.pack_quantity,
      customAttributes: data.custom_attributes,
      minStock: data.min_stock,
      maxStock: data.max_stock,
      productId: data.product_id
    });

    const mapRealtimeSale = (data: any): SaleRecord => ({
      ...data,
      siteId: data.site_id,
      date: data.sale_date || data.date || new Date().toISOString(),
      method: data.payment_method || data.method || 'Cash',
      amountTendered: data.amount_tendered ?? data.amountTendered,
      cashierName: data.cashier_name || data.cashierName,
      customerId: data.customer_id || data.customerId,
      receiptNumber: data.receipt_number || data.receiptNumber,
      items: Array.isArray(data.items) ? data.items : (data.sale_items || []).map((i: any) => ({
        ...i,
        id: i.product_id || i.id,
        name: i.product_name || i.name,
        costPrice: i.cost_price ?? i.costPrice,
        category: i.category
      }))
    });

    const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
      onProductChange: (event, payload) => {
        if (event === 'INSERT') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => prev.some(p => p.id === mapped.id) ? prev : [mapped, ...prev]);
          setAllProducts(prev => prev.some(p => p.id === mapped.id) ? prev : [mapped, ...prev]);
        }
        else if (event === 'UPDATE') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => prev.map(p => p.id === payload.id ? { ...p, ...mapped } : p));
          setAllProducts(prev => prev.map(p => p.id === payload.id ? { ...p, ...mapped } : p));
        }
        else if (event === 'DELETE') {
          const targetId = payload.old?.id || payload.id;
          setProducts(prev => prev.filter(p => p.id !== targetId));
          setAllProducts(prev => prev.filter(p => p.id !== targetId));
        }
      },
      onSaleChange: (event, payload) => {
        const saleId = payload.id || payload.old?.id;
        if (!saleId) return;

        if (event === 'INSERT' || event === 'UPDATE') {
          // Fetch complete sale with sale_items from DB
          salesService.getById(saleId).then((fullSale: any) => {
            if (fullSale) {
              setSales(prev => {
                const exists = prev.some(s => s.id === fullSale.id);
                if (exists) {
                  return prev.map(s => s.id === fullSale.id ? fullSale : s);
                }
                return [fullSale, ...prev];
              });
            }
          }).catch(() => {
            // Fallback to basic payload mapping if getById fails
            const mapped = mapRealtimeSale(payload);
            setSales(prev => {
              const exists = prev.some(s => s.id === mapped.id);
              if (exists) {
                return prev.map(s => s.id === mapped.id ? { ...s, ...mapped } : s);
              }
              return [mapped, ...prev];
            });
          });
        }
        else if (event === 'DELETE') {
          setSales(prev => prev.filter(s => s.id !== saleId));
        }
      },
      onStockChange: (_event, payload) => {
        // Product stock quantities are authoritatively synchronized via the `products`
        // table UPDATE event (`onProductChange`). Applying `stock_movements` audit
        // log deltas on top of `onProductChange` causes double/triple stock deductions.
        if (payload?.product_id && typeof payload?.quantity === 'number') {
          logger.debug('useRealtimeUpdates', 'Stock movement logged', {
            productId: payload.product_id,
            type: payload.type,
            quantity: payload.quantity
          });
        }
      },
      onCustomerChange: (event, payload) => {
        const custId = payload.id || payload.old?.id;
        if (event === 'INSERT') setCustomers(prev => prev.some(c => c.id === custId) ? prev : [payload, ...prev]);
        else if (event === 'UPDATE') setCustomers(prev => prev.map(c => c.id === custId ? { ...c, ...payload } : c));
        else if (event === 'DELETE') setCustomers(prev => prev.filter(c => c.id !== custId));
      },
      onPurchaseOrderChange: (event, payload) => {
        const poId = payload.id || payload.old?.id;
        if (!poId) return;

        if (event === 'INSERT' || event === 'UPDATE') {
          purchaseOrdersService.getById(poId).then((fullPO: any) => {
            if (fullPO) {
              setOrders(prev => {
                const exists = prev.some(o => o.id === fullPO.id);
                if (exists) return prev.map(o => o.id === fullPO.id ? fullPO : o);
                return [fullPO, ...prev];
              });
              setAllProducts?.((prev: any) => prev); // keep state reactive
            }
          }).catch(() => {
            // Fallback to basic payload if full fetch fails
            if (event === 'INSERT') setOrders(prev => prev.some(o => o.id === poId) ? prev : [payload, ...prev]);
            else if (event === 'UPDATE') setOrders(prev => prev.map(o => o.id === poId ? { ...o, ...payload } : o));
          });
        }
        else if (event === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== poId));
        }
      },
      onShiftChange: (event, payload) => {
        if (!setShifts) return;
        const shiftId = payload.id || payload.old?.id;
        if (!shiftId) return;

        if (event === 'INSERT') {
          const mapped = mapShiftRow(payload);
          setShifts(prev => prev.some(s => s.id === mapped.id) ? prev.map(s => s.id === mapped.id ? mapped : s) : [mapped, ...prev]);
        } else if (event === 'UPDATE') {
          const mapped = mapShiftRow(payload);
          setShifts(prev => {
            const exists = prev.some(s => s.id === mapped.id);
            if (!exists) return [mapped, ...prev];
            return prev.map(s => s.id === mapped.id ? { ...s, ...mapped } : s);
          });
        } else if (event === 'DELETE') {
          setShifts(prev => prev.filter(s => s.id !== shiftId));
        }
      }
    });

    return () => {
      logger.debug('useRealtimeUpdates', 'Unsubscribing from real-time updates...');
      realtimeService.unsubscribeAll(subscriptions);
    };
  }, [activeSiteId, setProducts, setAllProducts, setSales, setCustomers, setOrders, setShifts]);
}


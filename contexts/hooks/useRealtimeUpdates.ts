import { useEffect } from 'react';
import { realtimeService } from '../../services/realtime.service';
import { salesService } from '../../services/supabase.service';
import type { Product, SaleRecord, Customer, PurchaseOrder } from '../../types';
import { logger } from '../../utils/logger';

interface UseRealtimeUpdatesProps {
  activeSiteId: string;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setAllProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
}

export function useRealtimeUpdates({
  activeSiteId,
  setProducts,
  setAllProducts,
  setSales,
  setCustomers,
  setOrders
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
        // When a stock movement occurs, adjust the product's stock count in state
        if (payload?.product_id && typeof payload?.quantity === 'number') {
          const prodId = payload.product_id;
          const qtyDelta = payload.type === 'OUT' ? -payload.quantity : payload.quantity;
          setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: (p.stock || 0) + qtyDelta } : p));
          setAllProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: (p.stock || 0) + qtyDelta } : p));
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
        if (event === 'INSERT') setOrders(prev => prev.some(o => o.id === poId) ? prev : [payload, ...prev]);
        else if (event === 'UPDATE') setOrders(prev => prev.map(o => o.id === poId ? { ...o, ...payload } : o));
        else if (event === 'DELETE') setOrders(prev => prev.filter(o => o.id !== poId));
      }
    });

    return () => {
      logger.debug('useRealtimeUpdates', 'Unsubscribing from real-time updates...');
      realtimeService.unsubscribeAll(subscriptions);
    };
  }, [activeSiteId, setProducts, setAllProducts, setSales, setCustomers, setOrders]);
}


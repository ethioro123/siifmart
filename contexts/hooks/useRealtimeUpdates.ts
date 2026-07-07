import { useEffect } from 'react';
import { realtimeService } from '../../services/realtime.service';
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

    const subscriptions = realtimeService.subscribeToSite(activeSiteId, {
      onProductChange: (event, payload) => {
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

        if (event === 'INSERT') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => [mapped, ...prev]);
          setAllProducts(prev => [mapped, ...prev]);
        }
        else if (event === 'UPDATE') {
          const mapped = mapRealtimeProduct(payload);
          setProducts(prev => prev.map(p => p.id === payload.id ? { ...p, ...mapped } : p));
          setAllProducts(prev => prev.map(p => p.id === payload.id ? { ...p, ...mapped } : p));
        }
        else if (event === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.id));
          setAllProducts(prev => prev.filter(p => p.id !== payload.id));
        }
      },
      onSaleChange: (event, payload) => {
        if (event === 'INSERT') setSales(prev => [payload, ...prev]);
      },
      onCustomerChange: (event, payload) => {
        if (event === 'INSERT') setCustomers(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setCustomers(prev => prev.map(c => c.id === payload.id ? payload : c));
      },
      onPurchaseOrderChange: (event, payload) => {
        if (event === 'INSERT') setOrders(prev => [payload, ...prev]);
        else if (event === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
        else if (event === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.id));
      }
    });

    return () => {
      logger.debug('useRealtimeUpdates', 'Unsubscribing from real-time updates...');
      realtimeService.unsubscribeAll(subscriptions);
    };
  }, [activeSiteId, setProducts, setAllProducts, setSales, setCustomers, setOrders]);
}

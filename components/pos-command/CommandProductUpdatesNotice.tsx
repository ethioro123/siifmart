import { useData } from '../../contexts/DataContext';
import { useStore } from '../../contexts/CentralStore';
import { usePOSPriceHistory } from '../pos/hooks/usePOSPriceHistory';
import { CatalogUpdatesNotice } from '../pos/shared/CatalogUpdatesNotice';
export function CommandProductUpdatesNotice() {
  const { products, activeSite } = useData();
  const { user } = useStore();
  const refreshKey = products.filter(product => (product.siteId || product.site_id) === activeSite?.id)
    .map(product => `${product.id}:${product.priceUpdatedAt || product.price_updated_at || ''}`).sort().join('|');
  const history = usePOSPriceHistory(activeSite?.id, user?.id, refreshKey);
  return <CatalogUpdatesNotice namespace="posCommand" history={history} />;
}

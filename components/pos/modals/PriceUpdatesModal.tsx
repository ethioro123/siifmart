import { usePOS } from '../POSContext';
import { CatalogUpdatesNotice } from '../shared/CatalogUpdatesNotice';
export function PriceUpdatesModal() {
  const state = usePOS();
  return <CatalogUpdatesNotice namespace="pos" isOpen={state.isPriceUpdatesModalOpen} onOpenChange={state.setIsPriceUpdatesModalOpen} history={{
    entries: state.productPriceHistory, unreviewedCount: state.unreviewedPriceUpdateCount,
    isLoading: state.isPriceHistoryLoading, isLoadingMore: state.isLoadingMorePriceHistory,
    hasMore: state.hasMorePriceHistory, error: state.priceHistoryError,
    retry: state.retryPriceHistory, loadMore: state.loadMorePriceHistory, markReviewed: state.markPriceHistoryReviewed,
  }} />;
}
export default PriceUpdatesModal;

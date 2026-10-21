import { useCallback, useEffect, useRef, useState } from 'react';
import { ProductPriceHistoryEntry, productPriceHistoryService } from '../../../services/product-price-history.service';

const PAGE_SIZE = 50;
const REVIEW_COUNT_WINDOW_DAYS = 7;

export function usePOSPriceHistory(siteId: string | undefined, reviewerId: string | undefined, refreshKey: string) {
    const [entries, setEntries] = useState<ProductPriceHistoryEntry[]>([]);
    const [loadedSiteId, setLoadedSiteId] = useState<string | undefined>();
    const [loadedReviewerId, setLoadedReviewerId] = useState<string | undefined>();
    const [unreviewedCount, setUnreviewedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const identityRef = useRef({ siteId, reviewerId });
    identityRef.current = { siteId, reviewerId };

    const refresh = useCallback(async (isCurrent: () => boolean = () => true) => {
        setIsLoadingMore(false);
        if (!siteId) {
            setEntries([]);
            setLoadedSiteId(undefined);
            setLoadedReviewerId(undefined);
            setUnreviewedCount(0);
            setHasMore(false);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        const since = new Date(Date.now() - REVIEW_COUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
        try {
            const [page, count] = await Promise.all([
                productPriceHistoryService.listBySite(siteId, 0, PAGE_SIZE),
                productPriceHistoryService.countUnreviewed(siteId, since)
            ]);
            if (!isCurrent()) return;
            setEntries(page);
            setLoadedSiteId(siteId);
            setLoadedReviewerId(reviewerId);
            setHasMore(page.length === PAGE_SIZE);
            setUnreviewedCount(count);
        } catch {
            if (!isCurrent()) return;
            setError('Price history could not be loaded. Try again.');
        } finally {
            if (isCurrent()) setIsLoading(false);
        }
    }, [siteId, reviewerId]);

    useEffect(() => {
        let current = true;
        void refresh(() => current);
        return () => { current = false; };
    }, [refresh, refreshKey, reloadKey]);

    const retry = useCallback(() => setReloadKey(key => key + 1), []);

    const loadMore = useCallback(async () => {
        if (!siteId || isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        setError(null);
        try {
            const page = await productPriceHistoryService.listBySite(siteId, entries.length, PAGE_SIZE);
            if (identityRef.current.siteId !== siteId || identityRef.current.reviewerId !== reviewerId) return;
            setEntries(previous => {
                const existingIds = new Set(previous.map(entry => entry.id));
                return [...previous, ...page.filter(entry => !existingIds.has(entry.id))];
            });
            setHasMore(page.length === PAGE_SIZE);
        } catch {
            if (identityRef.current.siteId !== siteId || identityRef.current.reviewerId !== reviewerId) return;
            setError('More price history could not be loaded. Try again.');
        } finally {
            if (identityRef.current.siteId === siteId && identityRef.current.reviewerId === reviewerId) {
                setIsLoadingMore(false);
            }
        }
    }, [siteId, reviewerId, isLoadingMore, hasMore, entries.length]);

    const markReviewed = useCallback(async (historyIds: string[]) => {
        if (!reviewerId || historyIds.length === 0) return;
        await productPriceHistoryService.markReviewed(historyIds, reviewerId);
        if (identityRef.current.siteId !== siteId || identityRef.current.reviewerId !== reviewerId) return;
        setEntries(previous => previous.map(entry => historyIds.includes(entry.id) ? { ...entry, reviewed_by_me: true } : entry));
        if (siteId) {
            const since = new Date(Date.now() - REVIEW_COUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
            try {
                const count = await productPriceHistoryService.countUnreviewed(siteId, since);
                if (identityRef.current.siteId === siteId && identityRef.current.reviewerId === reviewerId) {
                    setUnreviewedCount(count);
                }
            } catch {
                // The review receipt is already saved; a later refresh will repair the badge count.
            }
        }
    }, [reviewerId, siteId]);

    const isCurrentIdentity = loadedSiteId === siteId && loadedReviewerId === reviewerId;
    return {
        entries: isCurrentIdentity ? entries : [],
        unreviewedCount: isCurrentIdentity ? unreviewedCount : 0,
        isLoading, isLoadingMore,
        hasMore: isCurrentIdentity && hasMore,
        error: isCurrentIdentity || !loadedSiteId ? error : null,
        retry, loadMore, markReviewed
    };
}

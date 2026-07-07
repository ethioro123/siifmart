import { useState, useCallback } from 'react';

export function useLoadingProgress() {
  const [isDataInitialLoading, setIsDataInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [loadingProgress, setLoadingProgress] = useState<{
    total: number;
    loaded: number;
    current: string;
    entities: Record<string, 'pending' | 'loading' | 'success' | 'error'>;
  }>({
    total: 0,
    loaded: 0,
    current: '',
    entities: {}
  });

  const onQueryProgress = useCallback((entity: string, status: 'loading' | 'success' | 'error') => {
    if (status === 'loading') {
      setLoadingProgress(prev => ({
        ...prev,
        current: entity,
        entities: { ...prev.entities, [entity]: 'loading' }
      }));
    } else if (status === 'success') {
      setLoadingProgress(prev => ({
        ...prev,
        loaded: prev.loaded + 1,
        entities: { ...prev.entities, [entity]: 'success' }
      }));
    } else if (status === 'error') {
      setLoadingProgress(prev => ({
        ...prev,
        loaded: prev.loaded + 1,
        entities: { ...prev.entities, [entity]: 'error' }
      }));
    }
  }, []);

  return {
    isDataInitialLoading,
    setIsDataInitialLoading,
    loadError,
    setLoadError,
    loadingProgress,
    setLoadingProgress,
    onQueryProgress
  };
}

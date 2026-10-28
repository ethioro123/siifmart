import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** Consume only explicit, allowlisted inbox destinations; preserve ordinary tab navigation. */
export function useApprovalDestination(handler: (params: URLSearchParams) => void) {
  const location = useLocation();
  const callback = useRef(handler);
  callback.current = handler;
  useEffect(() => { callback.current(new URLSearchParams(location.search)); }, [location.key, location.search]);
}

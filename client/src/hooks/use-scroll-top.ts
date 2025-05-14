import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook that scrolls to the top of the page whenever the location changes
 */
export function useScrollTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
}
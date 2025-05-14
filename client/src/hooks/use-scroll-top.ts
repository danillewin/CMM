import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook that instantly scrolls to the top of the page whenever the location changes
 */
export function useScrollTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // Instant scroll without animation
  }, [location]);
}
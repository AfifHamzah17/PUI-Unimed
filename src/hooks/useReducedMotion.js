import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const subscribe = (cb) => {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

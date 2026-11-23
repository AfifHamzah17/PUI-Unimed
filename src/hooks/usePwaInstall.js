import { useSyncExternalStore } from 'react';
import { pwa } from '../lib/pwa.js';

export function usePwaInstall() {
  const canInstall = useSyncExternalStore(pwa.subscribe, pwa.canInstall, () => false);
  return { canInstall, install: pwa.install };
}

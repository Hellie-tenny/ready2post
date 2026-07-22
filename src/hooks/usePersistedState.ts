import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'postank:';

/**
 * Like useState, but persists to localStorage under `postank:<key>` and
 * restores on mount. Only use this for small, JSON-serializable state —
 * text fields, style/preset choices. Never for images: HTMLImageElement/
 * HTMLCanvasElement aren't serializable, and photos are far too large for
 * localStorage's ~5-10MB quota anyway.
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // corrupt value or storage unavailable (private browsing, quota, etc.) — fall back silently
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — editing still works, it just won't persist this change
    }
  }, [key, state]);

  return [state, setState] as const;
}

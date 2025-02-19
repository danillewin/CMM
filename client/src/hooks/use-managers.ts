import { useState } from 'react';

const LAST_MANAGER_KEY = 'last-used-manager';

export function useManagers() {
  const [lastUsedManager, setLastUsedManager] = useState<string>(() => {
    return localStorage.getItem(LAST_MANAGER_KEY) || '';
  });

  const addManager = (manager: string) => {
    setLastUsedManager(manager);
    localStorage.setItem(LAST_MANAGER_KEY, manager);
  };

  return {
    lastUsedManager,
    addManager
  };
}
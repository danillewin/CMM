import { useState, useEffect } from 'react';

const STORAGE_KEY = 'meeting-managers';
const LAST_MANAGER_KEY = 'last-used-manager';

export function useManagers() {
  const [managers, setManagers] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [lastUsedManager, setLastUsedManager] = useState<string>(() => {
    return localStorage.getItem(LAST_MANAGER_KEY) || '';
  });

  const addManager = (manager: string) => {
    if (!managers.includes(manager)) {
      const newManagers = [...managers, manager];
      setManagers(newManagers);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newManagers));
    }
    setLastUsedManager(manager);
    localStorage.setItem(LAST_MANAGER_KEY, manager);
  };

  return {
    managers,
    lastUsedManager,
    addManager
  };
}
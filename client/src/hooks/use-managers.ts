import { useState, useEffect } from 'react';

const STORAGE_KEY = 'meeting-managers';

export function useManagers() {
  const [managers, setManagers] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const addManager = (manager: string) => {
    if (!managers.includes(manager)) {
      const newManagers = [...managers, manager];
      setManagers(newManagers);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newManagers));
    }
  };

  return {
    managers,
    addManager
  };
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface MarkdownLiveContextType {
  activeTitle: string;
  value: string;
  setActive: (title: string, value: string) => void;
}

const MarkdownLiveContext = createContext<MarkdownLiveContextType | undefined>(undefined);

export function MarkdownLiveProvider({ children }: { children: ReactNode }) {
  const [activeTitle, setActiveTitle] = useState('');
  const [value, setValue] = useState('');

  const setActive = useCallback((title: string, newValue: string) => {
    setActiveTitle(title);
    setValue(newValue || '');
  }, []);

  return (
    <MarkdownLiveContext.Provider value={{ activeTitle, value, setActive }}>
      {children}
    </MarkdownLiveContext.Provider>
  );
}

export function useMarkdownLive() {
  const context = useContext(MarkdownLiveContext);
  if (context === undefined) {
    throw new Error('useMarkdownLive must be used within a MarkdownLiveProvider');
  }
  return context;
}
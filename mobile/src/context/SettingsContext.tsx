'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type TextSize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('medium');

  // Load initial settings
  useEffect(() => {
    const savedSize = localStorage.getItem('app-text-size') as TextSize;
    if (savedSize) {
      setTextSizeState(savedSize);
    }
  }, []);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('app-text-size', size);
  };

  // Apply to root element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${textSize}`);
  }, [textSize]);

  return (
    <SettingsContext.Provider value={{ textSize, setTextSize }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

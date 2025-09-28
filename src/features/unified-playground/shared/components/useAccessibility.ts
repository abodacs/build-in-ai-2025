import { createContext, useContext } from 'react';
import { type AccessibilityContextValue } from '../utils/accessibility';

export const AccessibilityContext =
  createContext<AccessibilityContextValue | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibleWrapper');
  }
  return context;
}

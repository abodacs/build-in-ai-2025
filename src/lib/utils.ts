import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAiAvailable(): boolean {
  // Check if Chrome AI APIs are available
  // This is a placeholder implementation
  return typeof window !== 'undefined' && 'chrome' in window;
}

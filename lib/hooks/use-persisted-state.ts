import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: { 
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, Dispatch<SetStateAction<T>>] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, serialize(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, state]);

  return [state, setState];
}
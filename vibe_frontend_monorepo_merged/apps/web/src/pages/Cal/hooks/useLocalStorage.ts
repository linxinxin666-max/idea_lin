import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'calculator_state_v2'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch {
        // ignore
      }
      return valueToStore
    })
  }, [key])

  return [storedValue, setValue]
}

export function useCalculatorStorage<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  return useLocalStorage(STORAGE_KEY, initialValue)
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

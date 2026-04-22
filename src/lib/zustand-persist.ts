import type {StateStorage} from 'zustand/middleware'

import {createJSONStorage} from 'zustand/middleware'

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const getBrowserStorage = (): StateStorage => {
  if (typeof window === 'undefined') {
    return noopStorage
  }

  try {
    return window.localStorage
  } catch {
    return noopStorage
  }
}

export const jsonLocalStorage = createJSONStorage(getBrowserStorage)


import type { FC, PropsWithChildren } from "react";
import { createContext, useContext, useMemo } from "react";
import type { StateCreator, StoreApi } from "zustand";
import { createStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";

interface ZustandContextStore<
  State extends object,
  InitialState extends Partial<State>
> {
  Provider: FC<PropsWithChildren<{ initialState: InitialState }>>;
  useStore: <U>(
    selector: (state: State) => U,
    equalityFn?: (a: U, b: U) => boolean
  ) => U;
  getState: () => StoreApi<State> | null;
}

function useInitialStore<State extends object>(initializer: () => StoreApi<State>): StoreApi<State> {
  return useMemo(() => initializer(), [initializer]);
}

/**
 * Creates a Zustand + Context provider factory
 */
export function createZustandContextStore<
  State extends object,
  InitialState extends Partial<State>
>(
  initializer: (initial: InitialState) => StateCreator<State>
): ZustandContextStore<State, InitialState> {
  const StoreContext = createContext<StoreApi<State> | null>(null);

  // Hook to get the store from context
  const useStoreContext = (): StoreApi<State> => {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error(
        "Store not found in context. Did you forget to wrap in Provider?"
      );
    }
    return store;
  };

  const useZustandContextStore = <U,>(
    selector: (state: State) => U,
    equalityFn?: (a: U, b: U) => boolean
  ): U => {
    const store = useStoreContext();
    // Use useStoreWithEqualityFn from zustand/traditional for proper equality function support
    return useStoreWithEqualityFn(store, selector, equalityFn);
  };

  // Static method to get store (for use outside of React components)
  let currentStore: StoreApi<State> | null = null;

  const Provider: FC<PropsWithChildren<{ initialState: InitialState }>> = ({
    initialState,
    children,
  }) => {
    // Use ref to ensure the store is only created once per provider instance
    const store = useInitialStore(() => {
      const newStore = createStore<State>(initializer(initialState));
      currentStore = newStore;
      return newStore;
    });

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  };

  return {
    Provider,
    useStore: useZustandContextStore,
    getState: () => currentStore,
  };
}

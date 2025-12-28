import { useEffect, useMemo } from "react";
import { debounce } from "@lodash-es";

export function useDebouncedUpdater<Args extends unknown[]>(fn: (...args: Args) => void, wait = 250) {
  const debounced = useMemo(() => debounce(fn, wait), [fn, wait]);

  useEffect(
    () => () => {
      debounced.cancel();
    },
    [debounced]
  );

  return debounced as (...args: Args) => void;
}

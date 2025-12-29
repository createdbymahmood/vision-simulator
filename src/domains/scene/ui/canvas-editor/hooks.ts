import type { MutableRefObject } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { CanvasSize } from "./types";

export function useElementSize<T extends HTMLElement>(): [
  MutableRefObject<T | null>,
  CanvasSize
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

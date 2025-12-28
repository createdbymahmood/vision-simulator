import { useLayoutEffect, useRef, useState } from "react";

export function useStageSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const fallbackHeight = Math.max(640, typeof window !== "undefined" ? window.innerHeight - 240 : 700);
  const [size, setSize] = useState({ width: 1200, height: fallbackHeight });
  const rafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const width = containerRef.current?.clientWidth ?? size.width;
      const height = Math.max(640, typeof window !== "undefined" ? window.innerHeight - 240 : size.height);
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    measure();
    const onResize = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, size.height, size.width]);

  return size;
}

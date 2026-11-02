// src/features/approvalEngine/useCountUp.js
import { useEffect, useRef, useState } from "react";

// Eases a number from its previous value to `target`. Respects reduced motion.
export default function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || prev.current === target) {
      setValue(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
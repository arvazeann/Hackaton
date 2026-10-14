"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ProductCardReveal({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setArmed(true);
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className="product-card-reveal h-full"
      data-armed={armed}
      data-revealed={revealed}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

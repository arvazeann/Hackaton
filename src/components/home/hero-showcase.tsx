"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react";
import { formatRupiah } from "@/lib/format";
import type { ProductListItem } from "@/types";

function ProductSlide({
  product,
  index,
  total,
  active,
}: {
  product: ProductListItem;
  index: number;
  total: number;
  active: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isPlaceholder = product.coverImageUrl.startsWith("/products/item-");

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} dari ${total}: ${product.title}`}
      aria-hidden={!active}
      className="relative h-full w-full shrink-0 overflow-hidden"
    >
      {imageFailed || isPlaceholder ? (
        <div className="grid size-full place-items-center bg-sage px-6 text-center text-primary">
          <div className="grid justify-items-center gap-3">
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              className="size-12"
              fill="none"
            >
              <rect
                x="5"
                y="9"
                width="38"
                height="30"
                rx="6"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="17" cy="19" r="3" fill="currentColor" />
              <path
                d="m8 34 10-9 7 6 5-4 10 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span className="text-sm font-medium">
              Foto produk belum tersedia
            </span>
          </div>
        </div>
      ) : (
        <Image
          src={product.coverImageUrl}
          alt={product.title}
          fill
          draggable={false}
          sizes="(max-width: 1023px) 76vw, 375px"
          unoptimized
          priority={index === 0}
          onError={() => setImageFailed(true)}
          className="scale-[1.1] object-cover transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/door:scale-[1.12] motion-reduce:transition-none motion-reduce:transform-none"
        />
      )}
    </div>
  );
}
export function HeroShowcase({ products }: { products: ProductListItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const ignoreClick = useRef(false);
  const ignoreClickTimeout = useRef<number | null>(null);
  const wheelDeltaX = useRef(0);
  const lastWheelChange = useRef(0);
  const activeProduct = products[activeIndex];
  const paused = pointerInside || focusWithin || isDragging;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () =>
      setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (products.length < 2 || paused || !pageVisible || reducedMotion) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, pageVisible, paused, products.length, reducedMotion]);

  if (!activeProduct) return null;

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (
      products.length < 2 ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    dragStartX.current = event.clientX;
    setDragOffsetX(0);
    setIsDragging(true);
    ignoreClick.current = false;
    if (ignoreClickTimeout.current !== null)
      window.clearTimeout(ignoreClickTimeout.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    const limit = event.currentTarget.clientWidth * 0.8;
    setDragOffsetX(Math.max(-limit, Math.min(limit, distance)));
  };

  const handlePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    if (dragStartX.current === null) return;
    const deltaX = event.clientX - dragStartX.current;
    dragStartX.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
    if (Math.abs(deltaX) < 40) return;
    ignoreClick.current = true;
    setActiveIndex(
      (current) =>
        (current + (deltaX < 0 ? 1 : -1) + products.length) % products.length,
    );
    ignoreClickTimeout.current = window.setTimeout(() => {
      ignoreClick.current = false;
      ignoreClickTimeout.current = null;
    }, 500);
  };

  const handleWheel = (event: WheelEvent<HTMLAnchorElement>) => {
    if (products.length < 2 || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
      return;
    event.preventDefault();
    wheelDeltaX.current += event.deltaX;
    if (Math.abs(wheelDeltaX.current) < 70) return;
    const now = Date.now();
    if (now - lastWheelChange.current < 450) {
      wheelDeltaX.current = 0;
      return;
    }
    setActiveIndex(
      (current) =>
        (current + (wheelDeltaX.current > 0 ? 1 : -1) + products.length) %
        products.length,
    );
    lastWheelChange.current = now;
    wheelDeltaX.current = 0;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (products.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key))
      return;
    event.preventDefault();
    setActiveIndex(
      (current) =>
        (current + (event.key === "ArrowRight" ? 1 : -1) + products.length) %
        products.length,
    );
  };

  return (
    <section
      aria-label="Pilihan barang kos terbaru"
      aria-roledescription="carousel"
      className="group/door relative z-10 flex min-w-0 flex-col items-center justify-center px-4 py-5 sm:px-8 sm:py-7 lg:min-h-[560px] lg:py-4"
      onMouseEnter={() => setPointerInside(true)}
      onMouseLeave={() => setPointerInside(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocusWithin(false);
      }}
    >
      <div className="relative isolate h-[min(96vw,380px)] w-[min(70vw,280px)] overflow-visible sm:h-[450px] sm:w-[322px] md:h-[490px] md:w-[345px] lg:h-[520px] lg:w-full lg:max-w-[448px]">
        <Link
          href={`/products/${activeProduct.id}`}
          aria-label={`Lihat ${activeProduct.title}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStartX.current = null;
            setIsDragging(false);
            setDragOffsetX(0);
          }}
          onLostPointerCapture={() => {
            dragStartX.current = null;
            setIsDragging(false);
            setDragOffsetX(0);
          }}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          onClick={(event) => {
            if (!ignoreClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            ignoreClick.current = false;
            if (ignoreClickTimeout.current !== null) {
              window.clearTimeout(ignoreClickTimeout.current);
              ignoreClickTimeout.current = null;
            }
          }}
          className="absolute inset-0 block touch-pan-y cursor-grab select-none rounded-t-[170px] rounded-b-[22px] bg-cream p-2.5 shadow-[0_18px_42px_-20px_rgba(0,0,0,0.55)] active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peach"
        >
          <div className="relative size-full overflow-hidden rounded-t-[160px] rounded-b-[16px] bg-sage">
            <div
              className={`absolute inset-0 flex ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isDragging ? "transition-none" : "transition-transform duration-[650ms]"}`}
              style={{
                transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffsetX}px), 0, 0)`,
              }}
            >
              {products.map((product, index) => (
                <ProductSlide
                  key={product.id}
                  product={product}
                  index={index}
                  total={products.length}
                  active={index === activeIndex}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 p-3 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:inset-x-4 sm:bottom-4 sm:p-4">
              <span className="block text-[10px] font-semibold uppercase tracking-[.14em] text-white/90 sm:text-xs">
                Pilihan anak kos
              </span>
              <div className="mt-1 flex items-end justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium sm:text-base">
                  {activeProduct.title}
                </span>
                <span className="shrink-0 text-sm font-bold sm:text-base">
                  {formatRupiah(activeProduct.price)}
                </span>
              </div>
              {products.length > 1 && (
                <div
                  aria-hidden="true"
                  className="mt-2 flex items-center gap-1.5"
                >
                  {products.map((product, index) => (
                    <span
                      key={product.id}
                      className={`h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${index === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

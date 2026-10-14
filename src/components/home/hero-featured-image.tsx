"use client";

import Image from "next/image";
import { useState } from "react";

export function HeroFeaturedImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const hasNoProductPhoto = src.startsWith("/products/item-");

  if (failed || hasNoProductPhoto) {
    return (
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
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
      className="object-cover"
    />
  );
}

"use client";

import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export function ProductCardImage({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src.trim() || failed) {
    return (
      <div className="grid size-full place-items-center bg-sage/30 text-primary/50">
        <ImageIcon aria-hidden="true" size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
      className="object-contain p-2 transition-transform duration-image ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animation-none"
    />
  );
}

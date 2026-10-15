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

  return (
    <div className="absolute inset-x-0.5 top-0.5 bottom-0 overflow-hidden rounded-[1.125rem]">
      {!src.trim() || failed ? (
        <div className="grid size-full place-items-center bg-sage/30 text-primary/50">
          <ImageIcon aria-hidden="true" size={32} strokeWidth={1.5} />
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          onError={() => setFailed(true)}
          className="object-cover transition-transform duration-control ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/card:scale-[1.02] motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animation-none"
        />
      )}
    </div>
  );
}

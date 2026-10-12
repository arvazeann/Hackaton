"use client";
import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/components/forms/request-api";

export function FavoriteButton({
  productId,
  initial,
  disabled = false,
}: {
  productId: string;
  initial: boolean;
  disabled?: boolean;
}) {
  const [favorite, setFavorite] = useOptimistic(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={favorite ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={favorite}
      aria-disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        startTransition(async () => {
          setFavorite(!favorite);
          const result = favorite
            ? await requestApi(
                `/api/favorites/${encodeURIComponent(productId)}`,
                "DELETE",
              )
            : await requestApi("/api/favorites", "PUT", { productId });
          if (!result.success) {
            setFavorite(favorite);
          } else {
            router.refresh();
          }
        });
      }}
    >
      <Heart
        size={16}
        className={favorite ? "fill-rose-500 text-rose-500" : "text-stone-500"}
      />
    </button>
  );
}

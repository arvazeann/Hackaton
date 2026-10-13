"use client";
import { useOptimistic, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { requestApi } from "@/components/forms/request-api";

export function FavoriteButton({
  productId,
  initial,
  loginRequired = false,
}: {
  productId: string;
  initial: boolean;
  loginRequired?: boolean;
}) {
  const [favorite, setFavorite] = useOptimistic(initial);
  const [feedback, setFeedback] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      aria-disabled={false}
      aria-label={favorite ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={favorite}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (loginRequired) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }
        startTransition(async () => {
          setFeedback("");
          setFavorite(!favorite);
          try {
            const result = favorite
              ? await requestApi(
                  `/api/favorites/${encodeURIComponent(productId)}`,
                  "DELETE",
                )
              : await requestApi("/api/favorites", "PUT", { productId });
            if (!result.success) {
              setFavorite(favorite);
              setFeedback("Wishlist gagal diperbarui. Coba lagi.");
            } else {
              setFeedback(
                favorite ? "Dihapus dari wishlist." : "Disimpan ke wishlist.",
              );
              router.refresh();
            }
          } catch {
            setFavorite(favorite);
            setFeedback("Wishlist gagal diperbarui. Coba lagi.");
          }
        });
      }}
    >
      <Heart
        size={16}
        className={favorite ? "fill-rose-500 text-rose-500" : "text-stone-500"}
      />
      <span
        className="sr-only"
        role={feedback.includes("gagal") ? "alert" : "status"}
      >
        {feedback}
      </span>
    </button>
  );
}

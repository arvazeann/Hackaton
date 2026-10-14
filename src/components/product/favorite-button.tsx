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
      className="group/button pointer-events-auto grid size-11 place-items-center rounded-pill border border-sage bg-sage text-primary transition-[background-color,border-color,transform] duration-control ease-soft hover:border-accent-bright group-hover/card:border-accent-bright active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none motion-reduce:active:scale-100"
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
        className={`transition-[color,fill,transform] duration-control ease-soft group-hover/button:scale-110 motion-reduce:transition-none ${favorite ? "fill-primary text-primary" : "text-primary"}`}
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

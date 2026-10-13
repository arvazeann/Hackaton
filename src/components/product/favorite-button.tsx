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
      className="group/button pointer-events-auto grid size-10 place-items-center rounded-full border border-primary bg-primary text-primary-foreground transition-[background-color,transform] duration-200 ease-out hover:border-brand-orange hover:bg-brand-orange group-hover/card:border-accent-bright group-hover/card:bg-brand-orange active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none motion-reduce:active:scale-100"
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
        className={`transition-[color,fill,transform] duration-200 ease-out group-hover/button:scale-110 motion-reduce:transition-none ${favorite ? "fill-primary-foreground text-primary-foreground" : "text-primary-foreground"}`}
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

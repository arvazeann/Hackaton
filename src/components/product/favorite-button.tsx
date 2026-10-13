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
      className="group grid size-10 place-items-center rounded-full border border-[#e3ded2] bg-[#fffefa] transition-[background-color,transform] duration-200 ease-out hover:bg-[#f3e5dd] active:scale-95 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
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
        className={`transition-[color,fill,transform] duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none ${favorite ? "fill-rose-500 text-rose-500" : "text-stone-500 group-hover:text-[#a65b3f]"}`}
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

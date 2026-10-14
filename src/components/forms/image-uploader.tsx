"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { IMAGE_MAX_BYTES, IMAGE_MAX_COUNT } from "@/lib/product-images";

export type UploadImage = {
  id: string;
  storageKey: string;
  position: number;
  url: string;
  status: "ready" | "uploading" | "error";
  error?: string;
  retryable?: boolean;
};

type ProductImageInput = { storageKey: string; position: number };
type UploadResponse = { storageKey?: string; message?: string };

function newImageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function normalize(items: UploadImage[]) {
  return items.map((image, position) => ({ ...image, position }));
}

export function ImageUploader({
  initialImages = [],
  altPrefix = "Foto produk",
  onChange,
  onUploadingChange,
  error,
}: {
  initialImages?: UploadImage[];
  altPrefix?: string;
  onChange: (images: ProductImageInput[]) => void;
  onUploadingChange: (uploading: boolean) => void;
  error?: string;
}) {
  const inputId = useId();
  const [items, setItems] = useState<UploadImage[]>(initialImages);
  const [selectionError, setSelectionError] = useState("");
  const itemsRef = useRef(items);
  const urlsRef = useRef(new Map<string, string>());
  const filesRef = useRef(new Map<string, File>());
  const abortsRef = useRef(new Map<string, AbortController>());

  useEffect(
    () => () => {
      for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
      for (const controller of abortsRef.current.values()) controller.abort();
      urlsRef.current.clear();
      filesRef.current.clear();
      abortsRef.current.clear();
    },
    [],
  );

  function commit(nextItems: UploadImage[]) {
    const normalized = normalize(nextItems);
    itemsRef.current = normalized;
    setItems(normalized);
    onChange(
      normalized
        .filter((image) => image.status === "ready")
        .map(({ storageKey, position }) => ({ storageKey, position })),
    );
    onUploadingChange(normalized.some((image) => image.status === "uploading"));
  }

  function replaceItem(
    id: string,
    update: (image: UploadImage) => UploadImage,
  ) {
    const current = itemsRef.current;
    commit(current.map((image) => (image.id === id ? update(image) : image)));
  }

  async function upload(id: string) {
    const file = filesRef.current.get(id);
    const current = itemsRef.current.find((image) => image.id === id);
    if (!file || !current) return;

    const controller = new AbortController();
    abortsRef.current.set(id, controller);
    replaceItem(id, (image) => ({
      ...image,
      status: "uploading",
      error: undefined,
    }));

    const body = new FormData();
    body.append("file", file);
    body.append("purpose", "PRODUCT");
    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const result = (await response.json()) as UploadResponse;
      if (!response.ok || !result.storageKey)
        throw new Error(result.message ?? "Foto gagal diunggah. Coba lagi.");

      if (!itemsRef.current.some((image) => image.id === id)) return;
      replaceItem(id, (image) => ({
        ...image,
        storageKey: result.storageKey!,
        status: "ready",
        error: undefined,
        retryable: false,
      }));
      filesRef.current.delete(id);
    } catch (uploadError) {
      if (controller.signal.aborted) return;
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Foto gagal diunggah. Coba lagi.";
      replaceItem(id, (image) => ({
        ...image,
        status: "error",
        error: message,
        retryable: true,
      }));
    } finally {
      abortsRef.current.delete(id);
    }
  }

  function add(files: FileList | null) {
    if (!files) return;
    const available = IMAGE_MAX_COUNT - itemsRef.current.length;
    const selected = Array.from(files);
    setSelectionError(
      selected.length > Math.max(available, 0) ? "Maksimal lima foto." : "",
    );
    const additions: UploadImage[] = selected
      .slice(0, Math.max(available, 0))
      .map((file) => {
        const id = newImageId();
        const typeValid = ["image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        );
        const sizeValid = file.size <= IMAGE_MAX_BYTES;
        if (typeValid && sizeValid) filesRef.current.set(id, file);
        const previewUrl = typeValid ? URL.createObjectURL(file) : "";
        if (previewUrl) urlsRef.current.set(id, previewUrl);
        return {
          id,
          storageKey: "",
          position: itemsRef.current.length,
          url: previewUrl,
          status: typeValid && sizeValid ? "uploading" : "error",
          retryable: false,
          ...(!typeValid
            ? { error: "Gunakan foto JPEG, PNG, atau WebP." }
            : !sizeValid
              ? { error: "Ukuran foto maksimal 3 MB." }
              : {}),
        };
      });

    const next = [...itemsRef.current, ...additions];
    commit(next);
    for (const image of additions)
      if (image.status === "uploading") void upload(image.id);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= itemsRef.current.length) return;
    const next = [...itemsRef.current];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function remove(id: string) {
    const objectUrl = urlsRef.current.get(id);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    urlsRef.current.delete(id);
    filesRef.current.delete(id);
    abortsRef.current.get(id)?.abort();
    abortsRef.current.delete(id);
    commit(itemsRef.current.filter((image) => image.id !== id));
  }

  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-7 text-center text-sm text-muted-foreground"
      >
        Tambah foto (JPEG, PNG, WebP · maks. 3 MB; maksimal 5 foto)
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => {
          add(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      {selectionError && (
        <p role="alert" className="text-sm text-status-error-ink">
          {selectionError}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-status-error-ink">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-card bg-peach p-2"
          >
            <div className="relative size-full overflow-hidden rounded-image bg-cream">
              {image.url ? (
                <Image
                  src={image.url}
                  alt={`${altPrefix}, foto ${index + 1}`}
                  fill
                  unoptimized
                  className="rounded-image object-contain"
                />
              ) : (
                <div className="grid size-full place-items-center p-3 text-center text-sm text-muted-foreground">
                  Foto tidak dapat dipratinjau
                </div>
              )}
            </div>
            <span
              role="status"
              className="absolute bottom-1 left-1 rounded bg-foreground/65 px-2 py-1 text-xs text-primary-foreground"
            >
              {image.status === "uploading"
                ? "Mengunggah…"
                : image.status === "error"
                  ? "Gagal"
                  : index === 0
                    ? "Siap · Sampul"
                    : `Siap · Foto ${index + 1}`}
            </span>
            {image.error && (
              <p
                role="alert"
                className="absolute bottom-8 left-1 right-1 rounded bg-card/95 p-1 text-xs text-status-error-ink"
              >
                {image.error}
              </p>
            )}
            <div className="absolute right-1 top-1 flex gap-1">
              {image.status === "error" && image.retryable && (
                <button
                  type="button"
                  aria-label={`Coba unggah ulang foto ${index + 1}`}
                  onClick={() => void upload(image.id)}
                  className="rounded bg-card px-2 py-1 text-xs"
                >
                  Coba lagi
                </button>
              )}
              <button
                type="button"
                disabled={index === 0}
                aria-label={`Pindahkan foto ${index + 1} ke atas`}
                onClick={() => move(index, -1)}
                className="rounded bg-card px-2 py-1 text-xs disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                aria-label={`Pindahkan foto ${index + 1} ke bawah`}
                onClick={() => move(index, 1)}
                className="rounded bg-card px-2 py-1 text-xs disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Hapus foto produk ${index + 1}`}
                onClick={() => remove(image.id)}
                className="rounded bg-card px-2 py-1 text-xs"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

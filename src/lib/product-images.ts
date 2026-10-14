// The approved 3 MB cap uses decimal megabytes: 3 MB = 3,000,000 bytes.
export const IMAGE_MAX_BYTES = 3_000_000;
export const IMAGE_MAX_COUNT = 5;

export const STORED_IMAGE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

export const LEGACY_IMAGE_KEY_PATTERN = /^\/products\/item-[1-5]\.svg$/;
export const PRODUCT_IMAGE_KEY_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)|\/products\/item-[1-5]\.svg)$/i;

export function productImageUrl(storageKey: string, legacyUrl = storageKey) {
  if (STORED_IMAGE_FILENAME_PATTERN.test(storageKey))
    return `/uploads/${storageKey}`;

  if (LEGACY_IMAGE_KEY_PATTERN.test(storageKey)) return storageKey;

  try {
    const pathname = new URL(legacyUrl, "http://localhost").pathname;
    return LEGACY_IMAGE_KEY_PATTERN.test(pathname)
      ? pathname
      : "/products/item-1.svg";
  } catch {
    return "/products/item-1.svg";
  }
}

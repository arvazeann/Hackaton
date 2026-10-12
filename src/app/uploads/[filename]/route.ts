import { Readable } from "node:stream";
import { localImageStorage } from "@/server/storage/local-image-storage";
import { STORED_IMAGE_FILENAME_PATTERN } from "@/lib/product-images";

export const runtime = "nodejs";

function notFound() {
  return new Response("Not Found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  context: RouteContext<"/uploads/[filename]">,
) {
  const { filename } = await context.params;
  if (!STORED_IMAGE_FILENAME_PATTERN.test(filename)) return notFound();

  try {
    const fileStat = await localImageStorage.stat(filename);
    const stream = Readable.toWeb(
      localImageStorage.openReadStream(filename),
    ) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type":
          localImageStorage.mimeType(filename) ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return notFound();
  }
}

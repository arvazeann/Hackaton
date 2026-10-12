import { toast } from "sonner";
import type { ActionResult } from "@/types";

function isActionResult<T>(value: unknown): value is ActionResult<T> {
  if (typeof value !== "object" || value === null || !("success" in value))
    return false;
  if (value.success === true) return "data" in value;
  if (value.success !== false || !("error" in value)) return false;
  return (
    typeof value.error === "object" &&
    value.error !== null &&
    "message" in value.error &&
    typeof value.error.message === "string"
  );
}

export async function requestApi<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  payload?: unknown,
): Promise<ActionResult<T>> {
  let result: ActionResult<T>;
  try {
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
    const body: unknown = await response.json();
    result = isActionResult<T>(body)
      ? body
      : {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Respons layanan tidak valid.",
          },
        };
  } catch {
    result = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Tidak dapat menghubungi layanan.",
      },
    };
  }
  if (!result.success) toast.error(result.error.message);
  else toast.success("Perubahan tersimpan.");
  return result;
}

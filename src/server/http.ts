import type { ActionResult } from "@/types";

export function actionStatus(result: ActionResult<unknown>): number {
  if (result.success) return 200;
  switch (result.error.code) {
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
    case "PRODUCT_NOT_AVAILABLE":
    case "INVALID_STATUS_TRANSITION":
      return 409;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return 400;
  }
}

export function actionResponse<T>(
  result: ActionResult<T>,
  successStatus = 200,
) {
  return Response.json(result, {
    status: result.success ? successStatus : actionStatus(result),
  });
}

export async function readJson(
  request: Request,
): Promise<
  { success: true; data: unknown } | { success: false; response: Response }
> {
  try {
    return { success: true, data: await request.json() };
  } catch {
    return {
      success: false,
      response: Response.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Request tidak valid." },
        },
        { status: 400 },
      ),
    };
  }
}

export function validationResponse(
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return Response.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    { status: 400 },
  );
}

export function unauthenticatedResponse() {
  return actionResponse({
    success: false,
    error: {
      code: "UNAUTHENTICATED",
      message: "Silakan masuk terlebih dahulu.",
    },
  });
}

export function internalErrorResponse(message = "Terjadi kesalahan server.") {
  return actionResponse({
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  });
}

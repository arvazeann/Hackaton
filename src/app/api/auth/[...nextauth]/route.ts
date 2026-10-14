import { NextRequest } from "next/server";
import { handlers } from "../../../../../auth";
import { normalizeDevAuthRequest } from "@/lib/dev-network";

function withDevHost(handler: (request: NextRequest) => Promise<Response>) {
  return (request: NextRequest) => {
    const normalized = normalizeDevAuthRequest(request);
    return handler(
      normalized === request
        ? request
        : new NextRequest(normalized.url, normalized),
    );
  };
}

export const GET = withDevHost(handlers.GET);
export const POST = withDevHost(handlers.POST);

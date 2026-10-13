export function searchQuery(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

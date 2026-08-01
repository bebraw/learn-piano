export function createHealthResponse(routes: string[]): Response {
  return Response.json({
    ok: true,
    name: "learn-piano-worker",
    routes,
  });
}

// Optional shared-secret auth for worker-facing automation endpoints.
// If AUTOMATION_TOKEN is set on the dashboard, the worker must send it as a
// Bearer token. If unset (e.g. local dev), the endpoints are open.
export function workerAuthorized(request: Request): boolean {
  const token = process.env.AUTOMATION_TOKEN;
  if (!token) return true;
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${token}`;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

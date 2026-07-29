import type { APIRoute } from 'astro';
import { getWorkerControl, setWorkerEnabled, workerHeartbeat } from '../../../lib/db-config';
import { workerAuthorized, unauthorized } from '../../../lib/automation-auth';

// GET /api/automation/control  → current worker switch + last heartbeat (UI + worker)
export const GET: APIRoute = async () => {
  const control = await getWorkerControl();
  return new Response(JSON.stringify(control), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// POST /api/automation/control
//   { enabled: true|false }  → UI toggles the worker on/off
//   { heartbeat: true }      → worker checks in (requires token if set)
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (body.heartbeat) {
      if (!workerAuthorized(request)) return unauthorized();
      const control = await workerHeartbeat();
      return new Response(JSON.stringify(control), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (typeof body.enabled === 'boolean') {
      const control = await setWorkerEnabled(body.enabled);
      return new Response(JSON.stringify(control), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Provide { enabled: boolean } or { heartbeat: true }' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update control', details: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

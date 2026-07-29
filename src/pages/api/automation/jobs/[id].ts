import type { APIRoute } from 'astro';
import { getAutomationJobById, updateAutomationJob, updateRelease } from '../../../../lib/db-config';
import { workerAuthorized, unauthorized } from '../../../../lib/automation-auth';

// GET /api/automation/jobs/:id  → poll a single job (UI)
export const GET: APIRoute = async ({ params }) => {
  const job = await getAutomationJobById(Number(params.id));
  if (!job) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify(job), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// PATCH /api/automation/jobs/:id  { status, result, releaseStatus? }  → worker reports back
export const PATCH: APIRoute = async ({ params, request }) => {
  if (!workerAuthorized(request)) return unauthorized();
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { status, result, releaseStatus } = body;

    const job = await updateAutomationJob(id, { status, result });
    if (!job) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // If the worker resolved a new dashboard status for the release, apply it.
    if (releaseStatus && job.releaseId && ['In Review', 'Ready to publish', 'Published'].includes(releaseStatus)) {
      await updateRelease(job.releaseId, { status: releaseStatus });
    }

    return new Response(JSON.stringify(job), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update job', details: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

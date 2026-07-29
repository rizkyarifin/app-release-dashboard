import type { APIRoute } from 'astro';
import { getAutomationJobs, createAutomationJob, getReleaseById } from '../../../../lib/db-config';
import { workerAuthorized, unauthorized } from '../../../../lib/automation-auth';

// GET /api/automation/jobs        → recent jobs
// GET /api/automation/jobs?status=pending → worker fetches its queue (requires token if set)
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const status = url.searchParams.get('status') || undefined;
    // Worker-only when polling the pending queue.
    if (status === 'pending' && !workerAuthorized(request)) return unauthorized();
    const jobs = await getAutomationJobs(status);
    return new Response(JSON.stringify(jobs), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/automation/jobs  { type: 'status'|'publish', releaseId }  → enqueue from the UI
export const POST: APIRoute = async ({ request }) => {
  try {
    const { type, releaseId } = await request.json();

    if (type !== 'status' && type !== 'publish') {
      return new Response(JSON.stringify({ error: "type must be 'status' or 'publish'" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!releaseId) {
      return new Response(JSON.stringify({ error: 'releaseId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const release = await getReleaseById(Number(releaseId));
    if (!release) {
      return new Response(JSON.stringify({ error: 'Release not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if ((release.platform || '').toLowerCase() !== 'android') {
      return new Response(JSON.stringify({ error: 'Automation only supports Android releases' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Safety: only allow a publish job when the release is actually ready.
    if (type === 'publish' && release.status !== 'Ready to publish') {
      return new Response(JSON.stringify({ error: `Cannot publish: status is '${release.status}', not 'Ready to publish'` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const job = await createAutomationJob({
      type,
      releaseId: release.id,
      appId: release.appId,
      packageName: release.app?.packageName || '',
      appName: release.app?.name || '',
      orgName: release.organization?.name || '',
    });

    return new Response(JSON.stringify(job), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

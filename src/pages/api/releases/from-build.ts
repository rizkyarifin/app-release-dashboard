import type { APIRoute } from 'astro';
import { findOrCreateOrganization, findOrCreateApp, createRelease } from '../../../lib/db-config';
import { getOrganizationForApp } from '../../../lib/organization-mapper';
import { getPackageNameForApp } from '../../../lib/package-mapper';
import type { ReleaseCreate } from '../../../types';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.appName || !data.platform || !data.version || !data.branch || !data.tag) {
      return new Response(JSON.stringify({ error: 'Missing required fields: appName, platform, version, branch, tag' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate status if provided
    if (data.status && !['In Review', 'Ready to publish', 'Published'].includes(data.status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be one of: In Review, Ready to publish, Published' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate forceUpdate if provided
    if (data.forceUpdate && !['Yes', 'No'].includes(data.forceUpdate)) {
      return new Response(JSON.stringify({ error: 'Invalid forceUpdate. Must be either Yes or No' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resolve organization: use provided value or fall back to mapper
    const rawOrgName = data.organization || getOrganizationForApp(data.appName);
    // Convert snake_case to Title Case (e.g., "seven_mountains" -> "Seven Mountains")
    const orgName = rawOrgName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const organization = await findOrCreateOrganization(orgName);

    // Resolve app: find or create using appName + organization
    const app = await findOrCreateApp(data.appName, organization.id);

    // If packageName was provided and differs from what we have, log it but use the DB record
    // (the app entry is keyed by name+org, packageName is set on first creation)

    const releaseData: ReleaseCreate = {
      appId: app.id,
      platform: data.platform,
      version: data.version,
      branch: data.branch,
      tag: data.tag,
      status: data.status || 'In Review',
      uploadDate: data.uploadDate || new Date().toISOString(),
      forceUpdate: data.forceUpdate || 'No',
      additionalData: data.additionalData || undefined,
    };

    const release = await createRelease(releaseData);

    return new Response(JSON.stringify(release), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating release from build:', error);
    return new Response(JSON.stringify({ error: 'Failed to create release', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

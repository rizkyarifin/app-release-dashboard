import type { APIRoute } from 'astro';
import { getAllApps, getAppsByOrganization } from '../../../lib/db-config';

export const GET: APIRoute = async ({ url }) => {
  try {
    const organizationId = url.searchParams.get('organizationId');

    if (organizationId) {
      const apps = await getAppsByOrganization(Number(organizationId));
      return new Response(JSON.stringify(apps), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const apps = await getAllApps();
    return new Response(JSON.stringify(apps), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch apps' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

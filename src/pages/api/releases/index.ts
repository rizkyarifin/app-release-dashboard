import type { APIRoute } from 'astro';
import { getAllReleases, createRelease } from '../../../lib/db-config';
import type { ReleaseCreate } from '../../../types';

export const GET: APIRoute = async () => {
  try {
    const releases = getAllReleases();
    return new Response(JSON.stringify(releases), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch releases', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: ReleaseCreate = await request.json();
    
    // Validate required fields
    if (!data.appName || !data.platform || !data.version || !data.branch || !data.tag) {
      return new Response(JSON.stringify({ error: 'Missing required fields: appName, platform, version, branch, tag' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Validate status if provided
    if (data.status && !['In Review', 'Ready to publish', 'Published'].includes(data.status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be one of: In Review, Ready to publish, Published' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const release = createRelease(data);
    return new Response(JSON.stringify(release), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create release' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
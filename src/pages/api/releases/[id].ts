import type { APIRoute } from 'astro';
import { getReleaseById, updateRelease, deleteRelease } from '../../../lib/db-config';
import type { ReleaseUpdate } from '../../../types';

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    const release = await getReleaseById(id);
    
    if (!release) {
      return new Response(JSON.stringify({ error: 'Release not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(release), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch release' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const data: ReleaseUpdate = await request.json();
    
    // Validate status if provided
    if (data.status && !['In Review', 'Ready to publish', 'Published'].includes(data.status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be one of: In Review, Ready to publish, Published' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    const release = await updateRelease(id, data);
    
    if (!release) {
      return new Response(JSON.stringify({ error: 'Release not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify(release), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update release' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    const success = await deleteRelease(id);
    
    if (!success) {
      return new Response(JSON.stringify({ error: 'Release not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete release' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
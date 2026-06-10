import type { APIRoute } from 'astro';
import { deleteMultipleReleases } from '../../../lib/db-config';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { ids } = await request.json();
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ids must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validate all IDs are numbers
    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length !== ids.length) {
      return new Response(JSON.stringify({ error: 'All IDs must be valid numbers' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const deletedCount = await deleteMultipleReleases(numericIds);
    
    return new Response(JSON.stringify({ 
      message: `Deleted ${deletedCount} releases`,
      deletedCount 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting multiple releases:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete releases' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
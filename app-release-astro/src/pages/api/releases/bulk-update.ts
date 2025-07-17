import type { APIRoute } from 'astro';
import { updateMultipleReleaseStatus } from '../../../lib/db-config';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { ids, status } = await request.json();
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ids must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!status || !['In Review', 'Ready to publish', 'Published'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be one of: In Review, Ready to publish, Published' }), {
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
    
    const updatedCount = updateMultipleReleaseStatus(numericIds, status);
    
    return new Response(JSON.stringify({ 
      message: `Updated ${updatedCount} releases to status: ${status}`,
      updatedCount 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating multiple releases:', error);
    return new Response(JSON.stringify({ error: 'Failed to update releases' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
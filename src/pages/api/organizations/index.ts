import type { APIRoute } from 'astro';
import { getAllOrganizations } from '../../../lib/db-config';

export const GET: APIRoute = async () => {
  try {
    const organizations = await getAllOrganizations();
    return new Response(JSON.stringify(organizations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch organizations' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

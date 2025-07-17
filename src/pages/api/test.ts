import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const diagnostics: any = {
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      NETLIFY: process.env.NETLIFY || 'undefined',
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      tursoUrl: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.substring(0, 50) + '...' : 'undefined'
    }
  };

  try {
    // Test database connection
    const { getAllReleases } = await import('../../lib/db-config');
    const releases = await getAllReleases();
    diagnostics.database = {
      status: 'connected',
      releaseCount: releases.length
    };
  } catch (error) {
    diagnostics.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  return new Response(JSON.stringify(diagnostics, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
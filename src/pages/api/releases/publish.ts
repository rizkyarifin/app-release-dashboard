import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { getReleaseById } from '../../../lib/db-config';

const execAsync = promisify(exec);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { releaseId } = await request.json();
    
    if (!releaseId) {
      return new Response(JSON.stringify({ error: 'releaseId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get release details
    const release = await getReleaseById(releaseId);
    
    if (!release) {
      return new Response(JSON.stringify({ error: 'Release not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if status is "Ready to publish"
    if (release.status !== 'Ready to publish') {
      return new Response(JSON.stringify({ 
        error: 'App is not ready to publish',
        currentStatus: release.status 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Prepare the config for automation
    const automationConfig = {
      organizations: [
        {
          name: release.organization?.name || '',
          id: getOrganizationId(release.organization?.name || ''),
          apps: [
            {
              name: release.app?.name || '',
              packageName: getPackageName(release.app?.name || '')
            }
          ]
        }
      ],
      credentials: {
        email: process.env.GOOGLE_PLAY_EMAIL || "dev@brandsarelive.com",
        password: process.env.GOOGLE_PLAY_PASSWORD || ""
      },
      settings: {
        headless: false,
        timeout: 60000
      }
    };
    
    // Path to the automation script
    const automationPath = process.env.AUTOMATION_PATH || '../google-play-automation';
    const fullAutomationPath = path.resolve(process.cwd(), automationPath);
    const configPath = path.join(fullAutomationPath, 'temp-config.json');
    
    // Write temporary config
    const fs = await import('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(automationConfig, null, 2));
    
    // Execute the automation with --publish flag
    const command = `cd "${fullAutomationPath}" && node multi-org-automation.js --publish --config "${configPath}"`;
    
    console.log('Executing automation command:', command);
    
    // Run the automation in background (non-blocking)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Automation error:', error);
      }
      console.log('Automation output:', stdout);
      if (stderr) {
        console.error('Automation stderr:', stderr);
      }
      
      // Clean up temp config
      fs.unlink(configPath).catch(console.error);
    });
    
    return new Response(JSON.stringify({ 
      message: 'Publishing process started',
      releaseId,
      appName: release.app?.name,
      organization: release.organization?.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error triggering publish:', error);
    return new Response(JSON.stringify({ error: 'Failed to start publishing process' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Helper functions to map app names to package names and org names to IDs
function getPackageName(appName: string): string {
  const packageMapping: Record<string, string> = {
    'Woga Player': 'com.woga.player',
    'Q-Rated': 'com.bal.qrated',
    'Hotel Music': 'com.bal.hotel_music',
    // Add more mappings as needed
  };
  
  return packageMapping[appName] || appName.toLowerCase().replace(/\s+/g, '.');
}

function getOrganizationId(orgName: string): string {
  const orgMapping: Record<string, string> = {
    'Seven Mountains Media Family': '5111690629091342106',
    'Brands Are Live': '5170855913979160330',
    // Add more mappings as needed
  };
  
  return orgMapping[orgName] || '';
}
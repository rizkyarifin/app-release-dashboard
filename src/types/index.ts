export type ReleaseStatus = 'In Review' | 'Ready to publish' | 'Published';

// Organization table
export interface Organization {
  id: number;
  name: string;
}

export interface OrganizationCreate {
  name: string;
}

// App table
export interface App {
  id: number;
  name: string;
  packageName: string;
  organizationId: number;
}

export interface AppCreate {
  name: string;
  packageName: string;
  organizationId: number;
}

// Release table (with relationships)
export interface Release {
  id: number;
  appId: number;
  platform: string;
  version: string;
  branch: string;
  status: ReleaseStatus;
  tag: string;
  uploadDate: string;
  forceUpdate?: string;
  additionalData?: Record<string, any>;
  // Joined data for display
  app?: App;
  organization?: Organization;
}

export interface ReleaseCreate {
  appId: number;
  platform: string;
  version: string;
  branch: string;
  status?: ReleaseStatus;
  tag: string;
  uploadDate?: string;
  forceUpdate?: string;
  additionalData?: Record<string, any>;
}

export interface ReleaseUpdate {
  appId?: number;
  platform?: string;
  version?: string;
  branch?: string;
  status?: ReleaseStatus;
  tag?: string;
  uploadDate?: string;
  forceUpdate?: string;
  additionalData?: Record<string, any>;
}

// Automation job queue — the dashboard enqueues jobs; the local worker executes them.
export type JobType = 'status' | 'publish';
export type JobStatus = 'pending' | 'running' | 'done' | 'error';

export interface AutomationJob {
  id: number;
  type: JobType;
  releaseId: number | null;
  appId: number | null;
  packageName: string;
  appName: string;
  orgName: string;
  status: JobStatus;
  result: string | null;   // human-readable outcome / error
  createdAt: string;
  updatedAt: string;
}

export interface AutomationJobCreate {
  type: JobType;
  releaseId?: number | null;
  appId?: number | null;
  packageName: string;
  appName?: string;
  orgName?: string;
}

// Single-row control switch the web toggles and the worker polls.
export interface WorkerControl {
  enabled: boolean;
  heartbeat: string | null;  // last time the worker checked in (ISO)
  updatedAt: string | null;
}

// Legacy types for backward compatibility during migration
export interface ReleaseLegacy {
  id: number;
  organization: string;
  appName: string;
  platform: string;
  version: string;
  branch: string;
  status: ReleaseStatus;
  tag: string;
  uploadDate: string;
  forceUpdate?: string;
  additionalData?: Record<string, any>;
}
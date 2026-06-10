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
export type ReleaseStatus = 'In Review' | 'Ready to publish' | 'Published';

export interface Release {
  id: number;
  organization: string;
  appName: string;
  platform: string;
  version: string;
  branch: string;
  status: ReleaseStatus;
  tag: string;
  uploadDate: string;
  additionalData?: Record<string, any>;
}

export interface ReleaseCreate {
  organization: string;
  appName: string;
  platform: string;
  version: string;
  branch: string;
  status?: ReleaseStatus;
  tag: string;
  uploadDate?: string;
  additionalData?: Record<string, any>;
}

export interface ReleaseUpdate {
  organization?: string;
  appName?: string;
  platform?: string;
  version?: string;
  branch?: string;
  status?: ReleaseStatus;
  tag?: string;
  uploadDate?: string;
  additionalData?: Record<string, any>;
}
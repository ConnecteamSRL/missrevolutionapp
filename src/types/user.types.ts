import { Database, Enums } from '@mr-types/database.types';

export type MeDetailed = {
  gym: {
    id: string;
    name: string;
  } | null;
  mfa: {
    aal: 'aal1' | 'aal2';
    enabled: boolean;
  };
  role: Database['public']['Enums']['app_role'];
  avatar: {
    key: string;
    bucket: string;
    object: {
      name: string;
      size: number;
      owner: string;
      metadata: {
        eTag: string;
        size: number;
        mimetype: string;
        cacheControl: string;
        lastModified: string;
        contentLength: number;
        httpStatusCode: number;
      };
      mime_type: string;
      created_at: string;
      updated_at: string;
      last_accessed_at: string;
    };
  } | null;
  profile: {
    email: string;
    user_id: string;
    full_name: string | null;
    last_name: string | null;
    first_name: string | null;
    display_name: string | null;
    current_objective: Enums<'fitness_objective'>;
  };
  notifications_to_read: number;
  user_id: string;
  permissions: string[];
};

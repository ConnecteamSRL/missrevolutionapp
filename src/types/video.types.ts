export interface VideoCategory {
  id: string;
  gym_id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
}

export interface VideoBreadcrumbItem {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
}

export interface VideoCategoryChild {
  id: string;
  slug: string;
  name: string;
  children_count: number;
  videos_count: number;
}

export interface VideoItem {
  id: string;
  title: string;
  vimeo_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  free: boolean;
  is_active: boolean;
  published_at: string | null;
  source_video_url: string | null;
  description: string | null;
  position: number;
  playback_position: number | null;
  completed_at: string | null;
}

export interface VideoPageData {
  category: VideoCategory;
  parent: VideoCategory | null;
  breadcrumb: VideoBreadcrumbItem[];
  children: VideoCategoryChild[];
  videos: VideoItem[];
}

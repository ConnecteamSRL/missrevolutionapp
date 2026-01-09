export type GymVideo = {
  id: string;
  title: string;
  vimeo_id: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
};

export type GymVideoCategoryWithVideos = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number | null;
  videos: GymVideo[];
};

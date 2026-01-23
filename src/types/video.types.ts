import { Tables } from '@mr-types/database.types';

export type Video = Tables<'videos'>;

export type VideoPageData = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  breadcrumb: {
    id: string;
    name: string;
  }[];
  children: {
    id: string;
    name: string;
    videos_count: number;
  }[];
  videos: Video[];
};

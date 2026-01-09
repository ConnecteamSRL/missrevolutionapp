import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';

export type CheckupPhotoItem = {
  id: string;
  checkup_id: string;
  storage_path: string;
  pose_type: string;
  created_at: string;
  signedUrl: string | null;
};

interface PhotoCacheEntry {
  signedUrl: string;
  expiresAt: number;
}

interface PhotoCacheMap {
  [storagePath: string]: PhotoCacheEntry;
}

const PHOTOS_CACHE_KEY = 'checkup_photos_cache_v1';
const URL_TTL_SECONDS = 60 * 60 * 24 * 2;
const REFRESH_BUFFER_MS = 1000 * 60 * 60;

export const useCheckupPhotos = (userId: string | undefined) => {
  const [photos, setPhotos] = useState<CheckupPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: dbPhotos, error: dbError } = await supabase
        .from('user_checkup_photos')
        .select('id, checkup_id, storage_path, pose_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      if (!dbPhotos || dbPhotos.length === 0) {
        setPhotos([]);
        return;
      }

      const cacheRaw = await AsyncStorage.getItem(PHOTOS_CACHE_KEY);
      const cache: PhotoCacheMap = cacheRaw ? JSON.parse(cacheRaw) : {};
      const now = Date.now();

      const pathsToSign: string[] = [];

      dbPhotos.forEach((p) => {
        const cachedItem = cache[p.storage_path];
        if (!cachedItem || cachedItem.expiresAt < now + REFRESH_BUFFER_MS) {
          pathsToSign.push(p.storage_path);
        }
      });

      let newCache = { ...cache };

      if (pathsToSign.length > 0) {
        const { data: signedData, error: signError } = await supabase.storage
          .from('checkup_photos')
          .createSignedUrls(pathsToSign, URL_TTL_SECONDS);

        if (signError) throw signError;

        if (signedData) {
          signedData.forEach((item) => {
            if (item.signedUrl) {
              newCache[item.path!] = {
                signedUrl: item.signedUrl,
                expiresAt: now + URL_TTL_SECONDS * 1000,
              };
            }
          });
        }
        await AsyncStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(newCache));
      }

      const finalPhotos: CheckupPhotoItem[] = dbPhotos.map((p) => ({
        ...p,
        signedUrl: newCache[p.storage_path]?.signedUrl || null,
      }));

      setPhotos(finalPhotos);
    } catch (err) {
      console.error('Error fetching checkup photos:', err);
      setError('Impossibile caricare le foto.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, isLoading, error, refetch: fetchPhotos };
};

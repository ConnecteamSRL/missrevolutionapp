import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';

export type CheckupPhotoCategory = 'bia' | 'other';

export type CheckupPhotoItem = {
  id: string;
  checkup_id: string;
  storage_path: string;
  pose_type: CheckupPhotoCategory;
  created_at: string;
  signedUrl: string | null;
};

interface PhotoCacheEntry {
  signedUrl: string;
  expiresAt: number;
}

type PhotoCacheMap = Record<string, PhotoCacheEntry>;

const PHOTOS_CACHE_KEY = 'checkup_photos_cache_v1';
const URL_TTL_SECONDS = 60 * 60 * 24 * 2;
const REFRESH_BUFFER_MS = 1000 * 60 * 60;
const BUCKET = 'checkup_photos';

const normalizeCategory = (value: string | null): CheckupPhotoCategory =>
  value === 'bia' ? 'bia' : 'other';

const readCache = async (): Promise<PhotoCacheMap> => {
  try {
    const raw = await AsyncStorage.getItem(PHOTOS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as PhotoCacheMap) : {};
  } catch {
    return {};
  }
};

const writeCache = async (cache: PhotoCacheMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify(cache));
  } catch (cacheError) {
    console.warn('[checkup photos] cache write failed', cacheError);
  }
};

const removeCachedPath = async (storagePath: string): Promise<void> => {
  const cache = await readCache();
  if (!(storagePath in cache)) return;
  delete cache[storagePath];
  await writeCache(cache);
};

export const useCheckupPhotos = (userId: string | undefined) => {
  const [photos, setPhotos] = useState<CheckupPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchPhotos = useCallback(
    async (refresh = false): Promise<void> => {
      const requestId = ++requestIdRef.current;

      if (!userId) {
        setPhotos([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      if (refresh) setRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const { data: dbPhotos, error: dbError } = await supabase
          .from('user_checkup_photos')
          .select('id, checkup_id, storage_path, pose_type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        if (requestId !== requestIdRef.current) return;

        const rows = dbPhotos ?? [];
        const currentPaths = new Set(rows.map((photo) => photo.storage_path));
        const now = Date.now();
        const cached = await readCache();
        const nextCache: PhotoCacheMap = {};

        for (const [path, entry] of Object.entries(cached)) {
          if (currentPaths.has(path) && entry.expiresAt > now) nextCache[path] = entry;
        }

        const pathsToSign = rows
          .map((photo) => photo.storage_path)
          .filter(
            (path) => !nextCache[path] || nextCache[path].expiresAt < now + REFRESH_BUFFER_MS,
          );

        if (pathsToSign.length > 0) {
          const { data: signedData, error: signError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(pathsToSign, URL_TTL_SECONDS);

          if (signError) throw signError;

          for (const item of signedData ?? []) {
            if (item.path && item.signedUrl) {
              nextCache[item.path] = {
                signedUrl: item.signedUrl,
                expiresAt: now + URL_TTL_SECONDS * 1000,
              };
            }
          }
        }

        await writeCache(nextCache);
        if (requestId !== requestIdRef.current) return;

        setPhotos(
          rows.map((photo) => ({
            ...photo,
            pose_type: normalizeCategory(photo.pose_type),
            signedUrl: nextCache[photo.storage_path]?.signedUrl ?? null,
          })),
        );
      } catch (err) {
        console.error('Error fetching checkup photos:', err);
        if (requestId === requestIdRef.current) {
          setError('Impossibile caricare le foto.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  const createPhoto = useCallback(
    async (args: {
      checkupId: string;
      category: CheckupPhotoCategory;
      bytes: Uint8Array;
      contentType: string;
    }): Promise<CheckupPhotoItem> => {
      if (!userId) throw new Error('Authenticated user missing');

      const suffix = Math.random().toString(36).slice(2, 10);
      // L'estensione nel path e' l'unico segnale che distingue un PDF da una foto.
      const extension = args.contentType === 'application/pdf' ? 'pdf' : 'jpg';
      const storagePath = `${userId}/${args.checkupId}/${Date.now()}-${suffix}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, args.bytes, {
          contentType: args.contentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error: metadataError } = await supabase
        .from('user_checkup_photos')
        .insert({
          checkup_id: args.checkupId,
          user_id: userId,
          storage_path: storagePath,
          pose_type: args.category,
        })
        .select('id, checkup_id, storage_path, pose_type, created_at')
        .single();

      if (metadataError || !data) {
        const { error: rollbackError } = await supabase.storage.from(BUCKET).remove([storagePath]);
        if (rollbackError) {
          console.warn('[checkup photos] upload rollback left an orphan', rollbackError);
        }
        throw metadataError ?? new Error('Photo metadata missing');
      }

      return {
        ...data,
        pose_type: normalizeCategory(data.pose_type),
        signedUrl: null,
      };
    },
    [userId],
  );

  const removePhoto = useCallback(
    async (photo: CheckupPhotoItem): Promise<void> => {
      if (!userId) throw new Error('Authenticated user missing');

      const { data, error: metadataError } = await supabase
        .from('user_checkup_photos')
        .delete()
        .eq('id', photo.id)
        .eq('user_id', userId)
        .select('storage_path')
        .single();

      if (metadataError) throw metadataError;

      const storagePath = data.storage_path;
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (storageError) {
        console.warn('[checkup photos] delete left an orphan', storageError);
      }

      await removeCachedPath(storagePath);
    },
    [userId],
  );

  const uploadPhoto = useCallback(
    async (args: {
      checkupId: string;
      category: CheckupPhotoCategory;
      bytes: Uint8Array;
      contentType: string;
    }): Promise<void> => {
      await createPhoto(args);
      await fetchPhotos(true);
    },
    [createPhoto, fetchPhotos],
  );

  const deletePhoto = useCallback(
    async (photo: CheckupPhotoItem): Promise<void> => {
      await removePhoto(photo);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    },
    [removePhoto],
  );

  const replacePhoto = useCallback(
    async (photo: CheckupPhotoItem, bytes: Uint8Array, contentType: string): Promise<void> => {
      const replacement = await createPhoto({
        checkupId: photo.checkup_id,
        category: photo.pose_type,
        bytes,
        contentType,
      });

      try {
        await removePhoto(photo);
      } catch (replaceError) {
        try {
          await removePhoto(replacement);
        } catch (rollbackError) {
          console.warn('[checkup photos] replacement rollback failed', rollbackError);
        }
        throw replaceError;
      }

      await fetchPhotos(true);
    },
    [createPhoto, fetchPhotos, removePhoto],
  );

  return {
    photos,
    isLoading,
    refreshing,
    error,
    refetch: () => fetchPhotos(false),
    refresh: () => fetchPhotos(true),
    uploadPhoto,
    replacePhoto,
    deletePhoto,
  };
};

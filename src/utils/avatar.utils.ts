import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';

interface AvatarCacheEntry {
  normalizedKey: string;
  signedUrl: string;
  expiresAt: number;
}

const BUCKET_AVATARS = 'avatars' as const;
const AVATAR_CACHE_KEY = 'me_avatar_cache_v1';
const AVATAR_TTL_SEC = 2592000;
const AVATAR_TTL_MS = AVATAR_TTL_SEC * 1000;
const REFRESH_BUFFER_MS = 60_000;

export const getCachedAvatarUrl = async (avatarKey: string | null): Promise<string | null> => {
  const cached = await readAvatarCache();

  if (!avatarKey) {
    if (cached && cached.expiresAt > Date.now()) return cached.signedUrl;
    return null;
  }

  const normalizedKey = normalizeKeyOrName(avatarKey, BUCKET_AVATARS);

  if (
    cached &&
    cached.normalizedKey === normalizedKey &&
    cached.expiresAt > Date.now() + REFRESH_BUFFER_MS
  ) {
    return cached.signedUrl;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_AVATARS)
      .createSignedUrl(normalizedKey, AVATAR_TTL_SEC);

    if (error || !data?.signedUrl) {
      if (cached && cached.normalizedKey === normalizedKey && cached.expiresAt > Date.now()) {
        return cached.signedUrl;
      }
      return null;
    }

    const entry: AvatarCacheEntry = {
      normalizedKey,
      signedUrl: data.signedUrl,
      expiresAt: Date.now() + AVATAR_TTL_MS,
    };
    await writeAvatarCache(entry);
    return entry.signedUrl;
  } catch {
    if (cached && cached.normalizedKey === normalizedKey && cached.expiresAt > Date.now()) {
      return cached.signedUrl;
    }
    return null;
  }
};

function normalizeKeyOrName(keyOrName: string, bucket: string): string {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return keyOrName.replace(new RegExp(`^${escape(bucket)}/`), '');
}

async function readAvatarCache(): Promise<AvatarCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(AVATAR_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AvatarCacheEntry>;
    if (
      typeof parsed?.normalizedKey === 'string' &&
      typeof parsed?.signedUrl === 'string' &&
      typeof parsed?.expiresAt === 'number'
    ) {
      return parsed as AvatarCacheEntry;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeAvatarCache(entry: AvatarCacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

export const clearAvatarCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AVATAR_CACHE_KEY);
  } catch {}
};

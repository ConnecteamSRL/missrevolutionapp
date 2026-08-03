import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

interface BannerCacheEntry {
  bannerKey: string;
  localUri: string;
  cachedAt: number;
}

const CACHE_META_KEY = 'banner_cache_v1';

function getBannersDir(): Directory {
  return new Directory(Paths.cache, 'banners');
}

async function readMeta(): Promise<BannerCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BannerCacheEntry>;
    if (
      typeof parsed?.bannerKey === 'string' &&
      typeof parsed?.localUri === 'string' &&
      typeof parsed?.cachedAt === 'number'
    ) {
      return parsed as BannerCacheEntry;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeMeta(entry: BannerCacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_META_KEY, JSON.stringify(entry));
  } catch {}
}

function extensionFromKey(key: string): string {
  const dot = key.lastIndexOf('.');
  return dot !== -1 ? key.slice(dot) : '';
}

export async function getCachedBannerUri(
  bannerKey: string,
  remoteUrl: string,
): Promise<string | null> {
  try {
    const cached = await readMeta();

    // Cache hit — same bannerKey
    if (cached && cached.bannerKey === bannerKey) {
      const file = new File(cached.localUri);
      if (file.exists) {
        return cached.localUri;
      }
    }

    // Cache miss or different bannerKey — clean up old file if any
    if (cached && cached.bannerKey !== bannerKey) {
      try {
        const oldFile = new File(cached.localUri);
        if (oldFile.exists) oldFile.delete();
      } catch {}
    }

    // Ensure banners directory exists
    const bannersDir = getBannersDir();
    if (!bannersDir.exists) {
      bannersDir.create({ intermediates: true });
    }

    // Remove any stale file at the target path
    const ext = extensionFromKey(bannerKey);
    const targetFile = new File(bannersDir, `banner${ext}`);
    if (targetFile.exists) targetFile.delete();

    // Download new file — downloadFileAsync rifiuta anche quando la risposta
    // non e' 2xx. Qui si restituisce null e non remoteUrl: se la chiave punta a
    // un file che non c'e', servire lo stesso URL fa credere al chiamante di
    // avere un banner e al suo posto resta un rettangolo vuoto (immagine) o una
    // rotella infinita (video). Con null parte il ripiego.
    let downloaded: File;
    try {
      downloaded = await File.downloadFileAsync(remoteUrl, targetFile);
    } catch {
      return null;
    }

    const entry: BannerCacheEntry = {
      bannerKey,
      localUri: downloaded.uri,
      cachedAt: Date.now(),
    };
    await writeMeta(entry);
    return downloaded.uri;
  } catch {
    // Graceful degradation — serve from network
    return remoteUrl;
  }
}

export async function clearBannerCache(): Promise<void> {
  try {
    const bannersDir = getBannersDir();
    if (bannersDir.exists) bannersDir.delete();
  } catch {}
}

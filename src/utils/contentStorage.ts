import { supabase } from '@/src/lib/supabase';

/**
 * content-images e content-documents sono bucket PRIVATI: la rotta
 * /object/public non risponde piu' e l'unico modo di leggerli e' un URL
 * firmato, che scade. Qui stanno la firma (in lotti, con cache) e la
 * riscrittura dell'HTML dei contenuti.
 */
const CONTENT_IMAGES_BUCKET = 'content-images';
const CONTENT_DOCUMENTS_BUCKET = 'content-documents';

/** Durata di una firma. Un'ora copre la lettura di una scheda con larghezza. */
export const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Una firma viene considerata scaduta gia' 5 minuti prima della scadenza
 * vera, cosi' un download lento non parte con un URL che muore a meta'.
 * `useSignedContentHtml` rinnova esattamente a questo istante.
 */
export const SIGNED_URL_STALE_MARGIN_MS = 5 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };

/**
 * Cache di processo condivisa da tutte le schermate: la stessa immagine
 * ricorre in piu' schede e non ha senso rifirmarla a ogni montaggio.
 */
const imageUrlCache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry | undefined, now: number): entry is CacheEntry {
  return !!entry && entry.expiresAt - now > SIGNED_URL_STALE_MARGIN_MS;
}

/**
 * Firma i percorsi mancanti in UNA sola chiamata: una scheda puo' contenere
 * molte immagini e una richiesta per immagine sarebbe inaccettabile.
 * I percorsi che la RLS scarta restano fuori dalla mappa.
 */
export async function signContentImages(paths: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const resolved = new Map<string, string>();
  const missing: string[] = [];

  for (const path of paths) {
    const cached = imageUrlCache.get(path);
    if (isFresh(cached, now)) resolved.set(path, cached.url);
    else if (!missing.includes(path)) missing.push(path);
  }

  if (missing.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(CONTENT_IMAGES_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.warn('[content images] firma fallita', error);
    return resolved;
  }

  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;
  for (const row of data ?? []) {
    if (!row.path || !row.signedUrl) continue;
    imageUrlCache.set(row.path, { url: row.signedUrl, expiresAt });
    resolved.set(row.path, row.signedUrl);
  }
  return resolved;
}

/**
 * Firma un documento al momento in cui serve (apertura o download): non c'e'
 * niente da mettere in cache, il download parte subito dopo.
 */
export async function signContentDocument(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CONTENT_DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn('[content documents] firma fallita', path, error);
    return null;
  }
  return data.signedUrl;
}

// --- HTML dei contenuti ------------------------------------------------

/**
 * Contratto con il backoffice: nell'HTML salvato il src di un'immagine del
 * catalogo e' il PERCORSO nudo dell'oggetto su content-images, non un URL —
 * un URL firmato messo nel DB scadrebbe e lascerebbe l'immagine rotta.
 * Restano riconosciuti anche i vecchi URL pubblici assoluti.
 */
const IMG_SRC_ATTRIBUTE = /(<img\b[^>]*?\ssrc\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi;
const CONTENT_IMAGES_URL_MARKER = /\/storage\/v1\/object\/(?:sign|public)\/content-images\//;

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const isAbsoluteSrc = (src: string) => /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//');

/**
 * Percorso dell'oggetto se il valore punta a content-images, altrimenti null.
 * Vale sia per il src di un <img> nell'HTML sia per un campo libero come
 * videos.thumbnail_url, dove il null distingue la copertina esterna
 * (Vimeo, YouTube) da quella caricata dalla libreria immagini.
 */
export function contentImagePath(rawSrc: string): string | null {
  const src = decodeHtmlEntities(rawSrc).trim();
  if (!src) return null;
  if (!isAbsoluteSrc(src)) return src;
  const match = CONTENT_IMAGES_URL_MARKER.exec(src);
  if (!match) return null;
  const rest = src.slice(match.index + match[0].length).split('?')[0];
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

/** Percorsi content-images referenziati dall'HTML, senza duplicati. */
export function contentImagePathsInHtml(html: string): string[] {
  const paths: string[] = [];
  for (const match of html.matchAll(IMG_SRC_ATTRIBUTE)) {
    const path = contentImagePath(match[2] ?? match[3] ?? '');
    if (path && !paths.includes(path)) paths.push(path);
  }
  return paths;
}

/**
 * Un pixel trasparente inline, usato finche' la firma non e' arrivata.
 * La firma e' asincrona: al primo render la mappa e' ancora vuota, e lasciare
 * nel src il PERCORSO nudo lo fa risolvere a <Image> come "about:///<percorso>",
 * che il caricatore nativo rifiuta ("No suitable image URL loader found") — in
 * sviluppo e' una schermata rossa, in esercizio un riquadro rotto. Il pixel non
 * chiede niente alla rete, tiene in piedi il riquadro e sparisce da solo appena
 * l'URL firmato prende il suo posto.
 */
const PIXEL_TRASPARENTE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Sostituisce i percorsi con gli URL firmati; lascia intatto il resto. */
export function withContentImageUrls(html: string, urlByPath: Map<string, string>): string {
  return html.replace(IMG_SRC_ATTRIBUTE, (whole, prefix: string, doubleQuoted, singleQuoted) => {
    const path = contentImagePath(doubleQuoted ?? singleQuoted ?? '');
    // src esterno (Vimeo, YouTube, un https qualsiasi): non ci riguarda.
    if (!path) return whole;
    // Percorso del catalogo: o e' firmato, o non esce di qui. Vale anche per i
    // percorsi che la firma non ha risolto (scartati dalla RLS, file mancante):
    // prima restavano nudi nel src ed erano lo stesso errore, solo permanente.
    return `${prefix}"${urlByPath.get(path) ?? PIXEL_TRASPARENTE}"`;
  });
}

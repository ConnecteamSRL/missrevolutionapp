import { useEffect, useMemo, useState } from 'react';
import {
  contentImagePathsInHtml,
  signContentImages,
  SIGNED_URL_STALE_MARGIN_MS,
  SIGNED_URL_TTL_SECONDS,
  withContentImageUrls,
} from '@/src/utils/contentStorage';

/**
 * Il timer rinnova le firme esattamente quando la cache le considera
 * scadute (vedi SIGNED_URL_STALE_MARGIN_MS): una scheda lasciata aperta ore
 * non deve ritrovarsi con le immagini sparite.
 */
const REFRESH_MS = SIGNED_URL_TTL_SECONDS * 1000 - SIGNED_URL_STALE_MARGIN_MS;

/**
 * HTML pronto da mostrare: i src delle immagini del catalogo, salvati come
 * percorsi su un bucket privato, diventano URL firmati e restano validi
 * finche' la schermata e' montata.
 */
export function useSignedContentHtml(html: string | null | undefined): string {
  const source = html ?? '';
  const paths = useMemo(() => contentImagePathsInHtml(source), [source]);
  // I path sono la vera dipendenza dell'effetto: l'array e' nuovo a ogni
  // render dell'HTML, la chiave no.
  const pathsKey = paths.join('\n');

  const [urlByPath, setUrlByPath] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (paths.length === 0) {
      setUrlByPath(new Map());
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sign = async () => {
      const next = await signContentImages(paths).catch(() => new Map<string, string>());
      if (!active) return;
      if (next.size > 0) setUrlByPath(next);
      timer = setTimeout(sign, REFRESH_MS);
    };
    void sign();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey]);

  return useMemo(() => withContentImageUrls(source, urlByPath), [source, urlByPath]);
}

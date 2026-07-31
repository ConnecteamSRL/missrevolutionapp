import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  contentImagePath,
  signContentImages,
  SIGNED_URL_STALE_MARGIN_MS,
  SIGNED_URL_TTL_SECONDS,
} from '@/src/utils/contentStorage';

/**
 * Il timer rinnova le firme esattamente quando la cache le considera scadute
 * (vedi SIGNED_URL_STALE_MARGIN_MS): una lista lasciata aperta ore non deve
 * ritrovarsi con le copertine sparite.
 */
const REFRESH_MS = SIGNED_URL_TTL_SECONDS * 1000 - SIGNED_URL_STALE_MARGIN_MS;

/**
 * Sorgenti immagine pronte per una lista di campi liberi (videos.thumbnail_url
 * e simili): i valori che puntano a content-images vengono firmati TUTTI IN UN
 * COLPO, gli URL esterni tornano identici senza toccare la rete. Una griglia di
 * video non deve fare una richiesta di firma per riquadro.
 *
 * Restituisce un risolutore: null quando la copertina e' nostra ma la firma non
 * e' (ancora) arrivata, cosi' chi disegna mostra il segnaposto invece di un
 * riquadro rotto.
 */
export function useSignedContentImages(
  values: (string | null | undefined)[],
): (value: string | null | undefined) => string | null {
  const paths = useMemo(() => {
    const out: string[] = [];
    for (const value of values) {
      const path = contentImagePath(value ?? '');
      if (path && !out.includes(path)) out.push(path);
    }
    return out;
     
  }, [values]);
  // I path sono la vera dipendenza dell'effetto: l'array e' nuovo a ogni
  // render della lista, la chiave no.
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

  return useCallback(
    (value: string | null | undefined) => {
      const path = contentImagePath(value ?? '');
      // niente percorso: e' una copertina esterna, si usa tale e quale
      if (!path) return value || null;
      return urlByPath.get(path) ?? null;
    },
    [urlByPath],
  );
}

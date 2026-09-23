import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';

// Cartelle della cache che contengono file dell'utente: i PDF e i documenti
// scaricati dall'app, e quelle in cui i moduli nativi salvano le foto scattate,
// scelte dalla galleria o ricompresse (assistente AI, check-up, avatar, scanner).
const DOCUMENTI = 'documenti';
const CARTELLE_UTENTE = [DOCUMENTI, 'ImagePicker', 'ImageManipulator', 'Camera'];
// Le versioni precedenti scaricavano PDF e documenti nella radice della cache.
const DOCUMENTO_SCIOLTO = /\.(pdf|docx?|xlsx?|pptx?)$/i;

/**
 * Cartella in cui scaricare PDF e documenti da aprire o condividere: separata
 * dal resto della cache, cosi' al logout si cancella tutta insieme.
 */
export function cartellaDocumenti(): Directory {
  const cartella = new Directory(Paths.cache, DOCUMENTI);
  cartella.create({ intermediates: true, idempotent: true });
  return cartella;
}

/**
 * Al logout sul telefono non deve restare niente di chi esce: le immagini che
 * expo-image tiene in memoria e su disco (foto dei check-up, avatar…), i
 * documenti scaricati e i file temporanei delle foto.
 */
export async function svuotaCacheUtente(): Promise<void> {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]).catch(() => {});
  for (const nome of CARTELLE_UTENTE) {
    try {
      const cartella = new Directory(Paths.cache, nome);
      if (cartella.exists) cartella.delete();
    } catch {}
  }
  try {
    for (const voce of new Directory(Paths.cache).list()) {
      if (voce instanceof File && DOCUMENTO_SCIOLTO.test(voce.name)) voce.delete();
    }
  } catch {}
}

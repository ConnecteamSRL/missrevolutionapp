import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Enums } from '@mr-types/database.types';

export type Gender = Enums<'gender_enum'>;

const STORAGE_KEY = 'user-gender';

const GENDERS: Gender[] = ['maschio', 'femmina', 'non_binario', 'altro', 'non_dichiarato'];

const isGender = (value: unknown): value is Gender =>
  typeof value === 'string' && (GENDERS as string[]).includes(value);

interface GenderState {
  gender: Gender | null;
}

interface GenderActions {
  setGender: (gender: Gender | null) => void;
  hydrate: () => Promise<void>;
}

/**
 * Ultimo sesso conosciuto dell'utente, conservato sul dispositivo.
 *
 * Serve solo a scegliere il tema giusto all'avvio: il profilo arriva dopo il
 * login, mentre i colori servono da subito. Senza questa memoria un utente
 * maschio vedrebbe le schermate rosa per qualche istante a ogni riavvio.
 * Il valore autorevole resta quello del server, che lo sovrascrive appena
 * arriva.
 */
export const useGenderStore = create<GenderState & GenderActions>((set) => ({
  gender: null,
  setGender: (gender) => {
    set({ gender });
    const write =
      gender === null
        ? AsyncStorage.removeItem(STORAGE_KEY)
        : AsyncStorage.setItem(STORAGE_KEY, gender);
    write.catch((e) => {
      console.error('Failed to persist user gender', e);
    });
  },
  // Chiamata una volta all'avvio (root layout) mentre lo splash e' ancora
  // visibile, come per la dimensione del testo.
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isGender(stored)) {
        set({ gender: stored });
      }
    } catch (e) {
      console.error('Failed to hydrate user gender', e);
    }
  },
}));

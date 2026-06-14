import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ContentTextSizeLevel = 'normal' | 'large' | 'xlarge';

// Text-size multipliers applied to the workout/diet/recipe card content
// (HtmlContent with `scalableText` + DocumentsSection).
export const CONTENT_TEXT_SIZE_MULTIPLIERS: Record<ContentTextSizeLevel, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

const STORAGE_KEY = 'content-text-size-level';
const LEVEL_CYCLE: ContentTextSizeLevel[] = ['normal', 'large', 'xlarge'];

const isLevel = (value: unknown): value is ContentTextSizeLevel =>
  typeof value === 'string' && (LEVEL_CYCLE as string[]).includes(value);

interface ContentTextSizeState {
  level: ContentTextSizeLevel;
}

interface ContentTextSizeActions {
  cycleLevel: () => void;
  hydrate: () => Promise<void>;
}

type ContentTextSizeStore = ContentTextSizeState & ContentTextSizeActions;

export const useContentTextSizeStore = create<ContentTextSizeStore>((set, get) => ({
  level: 'normal',
  cycleLevel: () => {
    const next = LEVEL_CYCLE[(LEVEL_CYCLE.indexOf(get().level) + 1) % LEVEL_CYCLE.length];
    set({ level: next });
    AsyncStorage.setItem(STORAGE_KEY, next).catch((e) => {
      console.error('Failed to persist content text size level', e);
    });
  },
  // Called once at startup (root layout) while the splash screen is still up,
  // so the persisted level is in place before any content card renders.
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isLevel(stored)) {
        set({ level: stored });
      }
    } catch (e) {
      console.error('Failed to hydrate content text size level', e);
    }
  },
}));

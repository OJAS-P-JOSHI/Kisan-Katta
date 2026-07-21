import { create } from 'zustand';

type AppState = {
  /** Becomes true once startup work (fonts, splash, bootstrap) is complete. */
  isReady: boolean;
  setReady: (isReady: boolean) => void;
};

/** Global UI/app-level state. Keep feature state inside its own feature store. */
export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  setReady: (isReady) => set({ isReady }),
}));

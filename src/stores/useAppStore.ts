import { produce } from "immer";
import { create } from "zustand";
import { VoltrClient } from "@voltr/vault-sdk";

export interface AppStoreState {
  set: (fn: (s: AppStoreState) => void) => void;
  get: () => AppStoreState;
  voltrClient: VoltrClient | null;
}

const useAppStore = create<AppStoreState>((set, get) => {
  const setProducerFn = (fn: (s: AppStoreState) => void) => set(produce(fn));
  return {
    set: setProducerFn,
    get: () => get(),
    voltrClient: null,
  };
});

export default useAppStore;

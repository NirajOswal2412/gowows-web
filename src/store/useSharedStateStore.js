import { create } from "zustand";

export const useSharedStateStore = create((set, get) => ({
  smartPrompts: {},
  outlineText: {},

  setSmartPrompts: (module, prompts) =>
    set((state) => ({
      smartPrompts: { ...state.smartPrompts, [module]: prompts },
    })),

  getSmartPrompts: (module) => get().smartPrompts[module] || [],

  setOutlineText: (module, text) =>
    set((state) => ({
      outlineText: { ...state.outlineText, [module]: text },
    })),

  getOutlineText: (module) => get().outlineText[module] || "",
}));

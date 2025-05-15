import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set) => ({
      input: '',
      messages: [],

      setInput: (val) => set(() => ({ input: val })),

      setMessages: (msgs) =>
        set(() => ({
          messages: Array.isArray(msgs) ? msgs : [],
        })),

      addMessage: (msg) =>
        set((state) => ({
          messages: Array.isArray(state.messages)
            ? [...state.messages, msg]
            : [msg],
        })),

      clearMessages: () => set(() => ({ messages: [] }))
    }),
    {
      name: `chat-storage-${localStorage.getItem("username") || "guest"}`,
      getStorage: () => sessionStorage,
    }
  )
);

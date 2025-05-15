import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const username = localStorage.getItem('username') || 'guest';

const useKBChatStore = create(
  persist(
    (set) => ({
      chatInput: '',
      chatHistory: [],
      setChatInput: (input) => set({ chatInput: input }),
      setChatHistory: (history) => set({ chatHistory: history }),
      addMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
      clearChat: () => set({ chatInput: '', chatHistory: [] }),
    }),
    {
      name: `kb-chat-${username}`,
      storage: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    }
  )
);

export default useKBChatStore;

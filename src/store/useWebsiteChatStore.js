import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const username = localStorage.getItem('username') || 'guest';

const useWebsiteChatStore = create(
  persist(
    (set) => ({
      messages: [],
      chatInput: '',
      setMessages: (messages) => set({ messages }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setChatInput: (input) => set({ chatInput: input }),
      clearChat: () => set({ messages: [], chatInput: '' }),
    }),
    {
      name: `website-chat-${username}`,
      storage: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    }
  )
);

export default useWebsiteChatStore;

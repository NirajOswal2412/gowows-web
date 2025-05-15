import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const username = localStorage.getItem('username') || 'guest';

const useDBChatStore = create(
  persist(
    (set) => ({
      input: '',
      messages: [],
      setInput: (input) => set({ input }),
      setMessages: (messages) => set({ messages }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      clearChat: () => set({ input: '', messages: [] }),
    }),
    {
      name: `db-chat-${username}`,
      storage: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    }
  )
);

export default useDBChatStore;

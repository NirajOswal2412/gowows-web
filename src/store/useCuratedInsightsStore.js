// store/useCuratedInsightsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const username = localStorage.getItem('username') || 'guest';

const useCuratedInsightsStore = create(
  persist(
    (set) => ({
      insights: [],
      setInsights: (data) => set({ insights: data }),
      clearInsights: () => set({ insights: [] })
    }),
    {
      name: `curated-insights-${username}`,
      storage: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      }
    }
  )
);

export default useCuratedInsightsStore;

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type ActivePanel = 'chat' | 'form' | 'workflow' | 'preview';

interface UIState {
  // Sidebar state
  sidebarExpanded: boolean;
  sidebarHoverExpanded: boolean;

  // Panel state (for split-panel layout)
  leftPanelWidth: number;

  // Active navigation
  activeNavItem: string | null;

  // Theme state
  theme: Theme;

  // Active panel state
  activePanel: ActivePanel;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setSidebarHoverExpanded: (expanded: boolean) => void;

  // Panel actions
  setLeftPanelWidth: (width: number) => void;

  // Navigation actions
  setActiveNavItem: (item: string | null) => void;

  // Theme actions
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;

  // Active panel actions
  setActivePanel: (panel: ActivePanel) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  sidebarExpanded: true,
  sidebarHoverExpanded: false,
  leftPanelWidth: 40, // 40% default
  activeNavItem: null,
  theme: 'system' as Theme,
  activePanel: 'form' as ActivePanel,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ...initialState,

      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

      setSidebarHoverExpanded: (expanded) =>
        set({ sidebarHoverExpanded: expanded }),

      setLeftPanelWidth: (width) =>
        set({ leftPanelWidth: Math.min(Math.max(width, 20), 80) }), // Clamp 20-80%

      setActiveNavItem: (item) => set({ activeNavItem: item }),

      setTheme: (theme) => set({ theme }),

      cycleTheme: () =>
        set((state) => {
          const themes: Theme[] = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(state.theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          return { theme: themes[nextIndex] };
        }),

      setActivePanel: (panel) => set({ activePanel: panel }),

      reset: () => set(initialState),
    }),
    {
      name: 'bpa-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarExpanded: state.sidebarExpanded,
        leftPanelWidth: state.leftPanelWidth,
        theme: state.theme,
      }),
    }
  )
);

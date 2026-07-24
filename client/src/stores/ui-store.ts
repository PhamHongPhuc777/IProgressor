import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global client/UI state (not server data — that lives in TanStack Query).
 * Persisted so preferences survive reloads.
 */
interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: 'iprogressor-ui' },
  ),
)

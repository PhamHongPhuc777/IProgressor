import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Global client/UI state (not server data — that lives in TanStack Query).
 * Persisted so preferences survive reloads.
 */
interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      theme: systemTheme(),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'iprogressor-ui' },
  ),
)

// Keep the <html> `dark` class in sync with the stored theme. Runs at module
// load (before first paint, since a layout imports this store) and on every
// change, so the whole app — including the public auth pages — themes itself.
function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}
applyThemeClass(useUiStore.getState().theme)
useUiStore.subscribe((state) => applyThemeClass(state.theme))

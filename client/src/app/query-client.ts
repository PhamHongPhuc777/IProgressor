import { QueryClient } from '@tanstack/react-query'

// Server state lives here (TanStack Query); client/UI state lives in Zustand.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

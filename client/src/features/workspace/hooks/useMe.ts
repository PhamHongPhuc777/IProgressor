import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/workspace'

/**
 * Current user's profile + resolved permissions from GET /me. `can()` gates UI
 * off the same permission strings the backend's @PreAuthorize checks — the
 * client hides what the server would 403 anyway (defence in depth, not instead).
 */
export function useMe() {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  })

  const permissions = query.data?.permissions
  return {
    me: query.data,
    isLoading: query.isPending,
    can: (permission: string) => permissions?.includes(permission) ?? false,
  }
}

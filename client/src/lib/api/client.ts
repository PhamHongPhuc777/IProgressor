import { userManager } from '@/lib/auth/oidc'
import { env } from '@/config/env'

/** Thrown for any non-2xx response so callers can branch on `.status`. */
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const user = await userManager.getUser()
  return user?.access_token
    ? { Authorization: `Bearer ${user.access_token}` }
    : {}
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  for (const [key, value] of Object.entries(await authHeaders())) {
    headers.set(key, value)
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${env.API_BASE_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = undefined
    }
    throw new ApiError(res.status, `Request to ${path} failed (${res.status})`, body)
  }

  if (res.status === 204) return undefined as T
  const contentType = res.headers.get('content-type') ?? ''
  return (contentType.includes('application/json')
    ? res.json()
    : res.text()) as Promise<T>
}

const toBody = (body?: unknown) =>
  body != null ? JSON.stringify(body) : undefined

/** Typed HTTP verbs used by feature `api/` modules. */
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: toBody(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: toBody(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: toBody(body) }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}

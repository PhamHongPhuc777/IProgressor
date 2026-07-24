import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { userManager } from '@/lib/auth/oidc'
import { env } from '@/config/env'

/** The uniform response shape the Spring API wraps every JSON payload in. */
interface ApiEnvelope {
  success: boolean
  data?: unknown
  error?: { code: string; message: string; details?: unknown[] }
  timestamp?: string
}

function isEnvelope(body: unknown): body is ApiEnvelope {
  return typeof body === 'object' && body !== null && 'success' in body
}

/** Server pagination wrapper (PageResponse<T>). */
export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

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

const http: AxiosInstance = axios.create({ baseURL: env.API_BASE_URL })

// Inject the current bearer token on every request (async — reads the OIDC store).
http.interceptors.request.use(async (config) => {
  const user = await userManager.getUser()
  if (user?.access_token) {
    config.headers.set('Authorization', `Bearer ${user.access_token}`)
  }
  return config
})

// The API wraps every JSON payload in { success, data, timestamp }; unwrap to
// the inner `data` so feature code works with the bare payload.
function unwrap<T>(data: unknown): T {
  return (isEnvelope(data) ? (data.data as T) : (data as T))
}

function toApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const message =
      isEnvelope(body) && body.error?.message
        ? body.error.message
        : error.message || `Request failed (${status})`
    throw new ApiError(status, message, body)
  }
  throw error
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await http.request<unknown>(config)
    if (res.status === 204) return undefined as T
    return unwrap<T>(res.data)
  } catch (error) {
    toApiError(error)
  }
}

/** Typed HTTP verbs used by feature `api/` modules. Axios handles FormData
 *  (multipart boundary) and JSON content-type automatically. */
export const api = {
  get: <T>(path: string) => request<T>({ method: 'GET', url: path }),
  post: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'POST', url: path, data: body }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>({ method: 'POST', url: path, data: form }),
  put: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'PUT', url: path, data: body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>({ method: 'PATCH', url: path, data: body }),
  del: <T>(path: string) => request<T>({ method: 'DELETE', url: path }),
  /** For non-JSON downloads (e.g. CSV export) — returns the raw Blob, unwrapped. */
  getBlob: async (path: string): Promise<Blob> => {
    try {
      const res = await http.get<Blob>(path, { responseType: 'blob' })
      return res.data
    } catch (error) {
      toApiError(error)
    }
  },
}

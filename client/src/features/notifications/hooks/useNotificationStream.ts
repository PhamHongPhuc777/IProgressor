import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { userManager } from '@/lib/auth/oidc'
import { env } from '@/config/env'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Subscribes to GET /notifications/stream (SSE) and refreshes the notifications
 * query on each pushed event. Uses fetch-streaming rather than EventSource
 * because the endpoint needs the bearer token (EventSource can't set headers).
 * Reconnects with backoff; the list query's polling covers any gap.
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let stopped = false
    let retry = 0

    async function connect() {
      while (!stopped) {
        try {
          const user = await userManager.getUser()
          const token = user?.access_token
          if (!token) {
            await wait(2000)
            continue
          }

          const res = await fetch(`${env.API_BASE_URL}/notifications/stream`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
          })
          if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
          retry = 0

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (!stopped) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            let idx: number
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
              const frame = buffer.slice(0, idx)
              buffer = buffer.slice(idx + 2)
              // Any data frame is a pushed notification → refresh the list.
              if (frame.includes('data:')) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] })
              }
            }
          }
        } catch {
          if (stopped || controller.signal.aborted) return
        }
        retry = Math.min(retry + 1, 5)
        await wait(1000 * 2 ** retry)
      }
    }

    void connect()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [enabled, queryClient])
}

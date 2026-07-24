import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { userManager } from '@/lib/auth/oidc'
import { env } from '@/config/env'
import type { Notification } from '../api/notifications'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Parses one SSE frame's `data:` line(s) into the pushed Notification, or
 *  null for frames with no data (e.g. keep-alive comments). */
function parseFrame(frame: string): Notification | null {
  const dataLines = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
  if (dataLines.length === 0) return null
  try {
    return JSON.parse(dataLines.join('\n')) as Notification
  } catch {
    return null
  }
}

/**
 * Subscribes to GET /notifications/stream (SSE) and refreshes the notifications
 * query on each pushed event, optionally calling `onEvent` with the parsed
 * notification. Uses fetch-streaming rather than EventSource because the
 * endpoint needs the bearer token (EventSource can't set headers). Reconnects
 * with backoff; the list query's polling covers any gap.
 */
export function useNotificationStream(
  enabled: boolean,
  onEvent?: (notification: Notification) => void,
) {
  const queryClient = useQueryClient()
  // Ref so the long-lived connect() loop always calls the latest onEvent
  // without needing to reconnect the stream whenever the caller's callback
  // identity changes (e.g. re-renders as `me` loads).
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

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
              const notification = parseFrame(frame)
              if (notification) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] })
                onEventRef.current?.(notification)
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

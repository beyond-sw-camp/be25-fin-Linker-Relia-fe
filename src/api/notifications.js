import { authApi } from './axios'

export async function getNotifications(params = {}) {
  const response = await authApi.get('/notifications', { params })
  return response.data
}

export async function markNotificationAsRead(notificationId) {
  const response = await authApi.patch(`/notifications/${notificationId}/read`)
  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await authApi.patch('/notifications/read-all')
  return response.data
}

export function createNotificationStream({ getAccessToken, onEvent, onError }) {
  const apiOrigin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const baseURL = `${apiOrigin.replace(/\/+$/, '')}/api`
  const controller = new AbortController()
  let isClosed = false
  let reconnectTimerId = null

  async function connect() {
    const accessToken = getAccessToken?.()

    if (!accessToken || isClosed) {
      return
    }

    try {
      const response = await fetch(`${baseURL}/sse/subscribe`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`SSE subscribe failed: ${response.status}`)
      }

      await readEventStream(response.body.getReader(), onEvent)
    } catch (error) {
      if (!isClosed && error.name !== 'AbortError') {
        onError?.(error)
        reconnectTimerId = window.setTimeout(connect, 3000)
      }
    }
  }

  connect()

  return {
    close() {
      isClosed = true
      controller.abort()

      if (reconnectTimerId) {
        window.clearTimeout(reconnectTimerId)
      }
    },
  }
}

async function readEventStream(reader, onEvent) {
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const eventBlocks = buffer.split(/\r?\n\r?\n/)
    buffer = eventBlocks.pop() ?? ''

    eventBlocks.forEach((block) => {
      const event = parseSseBlock(block)

      if (event.event) {
        onEvent?.(event)
      }
    })
  }
}

function parseSseBlock(block) {
  return block.split(/\r?\n/).reduce(
    (event, line) => {
      if (line.startsWith('event:')) {
        event.event = line.slice(6).trim()
      }

      if (line.startsWith('data:')) {
        event.data = event.data ? `${event.data}\n${line.slice(5).trim()}` : line.slice(5).trim()
      }

      return event
    },
    { event: '', data: '' },
  )
}

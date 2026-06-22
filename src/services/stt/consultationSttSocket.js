function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function resolveDefaultWsBaseUrl() {
  const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')

  try {
    const parsedUrl = new URL(apiBaseUrl)

    if (parsedUrl.pathname.endsWith('/api')) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -4) || '/'
    }

    parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:'

    return trimTrailingSlash(parsedUrl.toString())
  } catch {
    return 'ws://localhost:8080'
  }
}

export function resolveConsultationSttWsUrl(sessionId, token) {
  const wsBaseUrl = trimTrailingSlash(import.meta.env.VITE_STT_WS_BASE_URL || resolveDefaultWsBaseUrl())
  const encodedToken = encodeURIComponent(token)

  return `${wsBaseUrl}/ws/consultation-stt/audio/${sessionId}?token=${encodedToken}`
}

function parseServerEvent(rawMessage) {
  try {
    return JSON.parse(rawMessage)
  } catch {
    return {
      type: 'ERROR',
      sessionId: null,
      text: null,
      message: '서버 메시지를 JSON으로 해석하지 못했습니다.',
    }
  }
}

export function createConsultationSttSocket({ sessionId, token, onOpen, onClose, onEvent, onError }) {
  const socket = new WebSocket(resolveConsultationSttWsUrl(sessionId, token))
  socket.binaryType = 'arraybuffer'

  const openPromise = new Promise((resolve, reject) => {
    socket.addEventListener(
      'open',
      () => {
        onOpen?.()
        resolve()
      },
      { once: true },
    )

    socket.addEventListener(
      'error',
      (event) => {
        reject(event)
      },
      { once: true },
    )
  })

  socket.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') {
      return
    }

    onEvent?.(parseServerEvent(event.data))
  })

  socket.addEventListener('close', (event) => {
    onClose?.(event)
  })

  socket.addEventListener('error', (event) => {
    onError?.(event)
  })

  return {
    socket,
    waitForOpen: () => openPromise,
    sendAudioChunk(chunk) {
      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('STT WebSocket이 연결되지 않아 오디오 청크를 전송할 수 없습니다.')
      }

      socket.send(chunk)
    },
    sendComplete() {
      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('STT WebSocket이 연결되지 않아 COMPLETE를 전송할 수 없습니다.')
      }

      socket.send('COMPLETE')
    },
    close() {
      if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        return
      }

      socket.close()
    },
  }
}

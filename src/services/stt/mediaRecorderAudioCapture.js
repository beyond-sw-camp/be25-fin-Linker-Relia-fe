const DEFAULT_TIMESLICE = 250

const MIME_TYPE_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

export function resolveSupportedMediaRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }

  return MIME_TYPE_CANDIDATES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || ''
}

export async function createMediaRecorderAudioCapture({ onChunk, onError, timeslice = DEFAULT_TIMESLICE } = {}) {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('이 브라우저는 마이크 녹음을 지원하지 않습니다.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = resolveSupportedMediaRecorderMimeType()
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  const pendingChunkTasks = new Set()

  recorder.addEventListener('dataavailable', (event) => {
    if (!event.data || event.data.size === 0) {
      return
    }

    const pendingTask = event.data
      .arrayBuffer()
      .then((buffer) => {
        if (buffer.byteLength === 0) {
          return
        }

        return onChunk?.(buffer)
      })
      .catch((error) => {
        onError?.(error)
      })
      .finally(() => {
        pendingChunkTasks.delete(pendingTask)
      })

    pendingChunkTasks.add(pendingTask)
  })

  recorder.addEventListener('error', (event) => {
    onError?.(event.error || new Error('녹음 중 알 수 없는 오류가 발생했습니다.'))
  })

  return {
    mimeType: recorder.mimeType || mimeType || 'browser-default',
    async start() {
      recorder.start(timeslice)
    },
    async stop() {
      if (recorder.state === 'inactive') {
        return
      }

      await new Promise((resolve) => {
        recorder.addEventListener('stop', resolve, { once: true })
        recorder.stop()
      })

      await Promise.allSettled([...pendingChunkTasks])
      stream.getTracks().forEach((track) => track.stop())
    },
    dispose() {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }

      stream.getTracks().forEach((track) => track.stop())
    },
  }
}

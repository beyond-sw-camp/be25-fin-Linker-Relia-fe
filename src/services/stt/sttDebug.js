const MAX_DEBUG_LOGS = 80

export function createInitialSttDebugState() {
  return {
    capture: {
      mode: 'IDLE',
      inputSampleRate: null,
      inputChannelCount: null,
      targetSampleRate: 16000,
      targetChannelCount: 1,
      bitDepth: 16,
      payloadType: 'ArrayBuffer',
      bufferSize: null,
    },
    transform: {
      format: 'PCM',
      outputSampleRate: 16000,
      outputChannelCount: 1,
      bitDepth: 16,
      endian: 'Little Endian',
      lastInputFrameCount: 0,
      lastOutputSampleCount: 0,
    },
    transport: {
      payloadType: 'ArrayBuffer',
      chunkCount: 0,
      totalBytes: 0,
      lastByteLength: 0,
    },
    recentError: '',
    logs: [],
  }
}

export function resetSttDebugState(state) {
  const nextState = createInitialSttDebugState()
  Object.assign(state.capture, nextState.capture)
  Object.assign(state.transform, nextState.transform)
  Object.assign(state.transport, nextState.transport)
  state.recentError = ''
  state.logs = []
}

export function appendSttDebugLog(state, stage, message, details = null) {
  state.logs = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
      stage,
      message,
      details,
    },
    ...state.logs,
  ].slice(0, MAX_DEBUG_LOGS)
}

export function recordCaptureDebug(state, details = {}, message = '') {
  Object.assign(state.capture, details)

  if (message) {
    appendSttDebugLog(state, 'Capture', message, details)
  }
}

export function recordTransformDebug(state, details = {}, message = '') {
  Object.assign(state.transform, {
    ...details,
    lastInputFrameCount: details.inputFrameCount ?? state.transform.lastInputFrameCount,
    lastOutputSampleCount: details.outputSampleCount ?? state.transform.lastOutputSampleCount,
  })

  if (message) {
    appendSttDebugLog(state, 'Transform', message, details)
  }
}

export function recordTransportDebug(state, details = {}, message = '') {
  const byteLength = Number(details.byteLength || 0)
  state.transport.payloadType = details.payloadType || state.transport.payloadType
  state.transport.chunkCount += details.incrementChunkCount ? 1 : 0
  state.transport.totalBytes += byteLength
  state.transport.lastByteLength = byteLength || state.transport.lastByteLength

  if (message) {
    appendSttDebugLog(state, 'Transport', message, details)
  }
}

export function recordSttDebugError(state, message, details = null) {
  state.recentError = message
  appendSttDebugLog(state, 'Error', message, details)
}

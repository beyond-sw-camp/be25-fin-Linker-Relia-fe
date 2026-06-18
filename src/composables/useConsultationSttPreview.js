import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import {
  completeConsultationSttSession,
  createConsultationSttSession,
  getConsultationSttSession,
} from '../api/consultationStt'
import { createConsultationSttSocket } from '../services/stt/consultationSttSocket'
import { createPcmAudioCapture } from '../services/stt/pcmAudioCapture'
import {
  appendSttDebugLog,
  createInitialSttDebugState,
  recordCaptureDebug,
  recordSttDebugError,
  recordTransformDebug,
  recordTransportDebug,
  resetSttDebugState,
} from '../services/stt/sttDebug'
import { useAuthStore } from '../stores/auth'

const POLLING_INTERVAL_MS = 1500
const MAX_POLLING_ATTEMPTS = 10

function normalizeErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage
}

export function useConsultationSttPreview() {
  const authStore = useAuthStore()
  const sessionForm = reactive({
    customerId: '',
    consultationType: 'NEW_CONTRACT',
  })

  const sessionId = ref('')
  const sessionStatus = ref('IDLE')
  const partialText = ref('')
  const finalText = ref('')
  const errorMessage = ref('')
  const wsConnectionState = ref('DISCONNECTED')
  const recordingState = ref('IDLE')
  const startedAt = ref('')
  const endedAt = ref('')
  const isBusy = ref(false)
  const audioDebug = reactive(createInitialSttDebugState())

  const socketClient = ref(null)
  const audioCapture = ref(null)
  const hasSentCompleteSignal = ref(false)
  const hasRequestedRestCompletion = ref(false)
  const pollingTimerId = ref(0)
  const pollingAttempts = ref(0)

  const canStartSession = computed(() => Boolean(sessionForm.consultationType) && !isBusy.value)
  const canStartRecording = computed(() => {
    return (
      Boolean(sessionId.value) &&
      wsConnectionState.value === 'OPEN' &&
      recordingState.value !== 'RECORDING' &&
      !isBusy.value
    )
  })
  const canStopRecording = computed(() => recordingState.value === 'RECORDING')

  function appendSessionLog(message, details = null) {
    appendSttDebugLog(audioDebug, 'Session', message, details)
  }

  function setError(message, details = null) {
    errorMessage.value = message
    recordSttDebugError(audioDebug, message, details)
  }

  function applySessionSnapshot(snapshot) {
    if (!snapshot) {
      return
    }

    sessionId.value = snapshot.sessionId || sessionId.value
    sessionStatus.value = snapshot.sessionStatus || sessionStatus.value
    partialText.value = snapshot.partialText || partialText.value
    finalText.value = snapshot.finalText || finalText.value
    startedAt.value = snapshot.startedAt || startedAt.value
    endedAt.value = snapshot.endedAt || endedAt.value
  }

  function clearPolling() {
    if (pollingTimerId.value) {
      window.clearTimeout(pollingTimerId.value)
      pollingTimerId.value = 0
    }
  }

  async function refreshSession() {
    if (!sessionId.value) {
      return null
    }

    const response = await getConsultationSttSession(sessionId.value)
    applySessionSnapshot(response?.result)
    appendSessionLog(`session fetch -> ${response?.result?.sessionStatus || 'UNKNOWN'}`)
    return response?.result || null
  }

  async function completeSessionIfNeeded(textSource) {
    if (!sessionId.value || !textSource || hasRequestedRestCompletion.value) {
      return null
    }

    const latestSession = await refreshSession()

    if (['COMPLETED', 'FAILED'].includes(latestSession?.sessionStatus)) {
      appendSessionLog(`skip rest complete -> ${latestSession.sessionStatus}`)
      return latestSession
    }

    hasRequestedRestCompletion.value = true
    appendSessionLog('rest complete request')

    try {
      const response = await completeConsultationSttSession(sessionId.value, {
        finalText: textSource,
      })

      applySessionSnapshot(response?.result)
      appendSessionLog(`rest complete -> ${response?.result?.sessionStatus || 'UNKNOWN'}`)
      return response?.result || null
    } catch (error) {
      hasRequestedRestCompletion.value = false
      throw error
    }
  }

  async function pollSessionUntilSettled() {
    clearPolling()

    if (!sessionId.value || pollingAttempts.value >= MAX_POLLING_ATTEMPTS) {
      return
    }

    pollingAttempts.value += 1

    try {
      const latestSession = await refreshSession()

      if (latestSession?.finalText && !finalText.value) {
        finalText.value = latestSession.finalText
      }

      if (latestSession?.sessionStatus === 'COMPLETED') {
        appendSessionLog('session completed')
        return
      }

      if (latestSession?.sessionStatus === 'FAILED') {
        setError('STT session ended in FAILED state.')
        return
      }

      pollingTimerId.value = window.setTimeout(pollSessionUntilSettled, POLLING_INTERVAL_MS)
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to refresh STT session state.'))
    }
  }

  function teardownSocket() {
    socketClient.value?.close()
    socketClient.value = null

    if (wsConnectionState.value !== 'DISCONNECTED') {
      wsConnectionState.value = 'DISCONNECTED'
    }
  }

  function handleCaptureDebug(debugEvent) {
    if (debugEvent.stage === 'capture') {
      recordCaptureDebug(audioDebug, debugEvent.details, debugEvent.message)
      return
    }

    if (debugEvent.stage === 'transform') {
      recordTransformDebug(audioDebug, debugEvent.details, debugEvent.message)
    }
  }

  async function connectSocket() {
    if (!sessionId.value) {
      throw new Error('STT session has not been created yet.')
    }

    if (!authStore.accessToken) {
      throw new Error('Missing access token for STT WebSocket.')
    }

    teardownSocket()
    wsConnectionState.value = 'CONNECTING'
    appendSessionLog('ws connect')

    socketClient.value = createConsultationSttSocket({
      sessionId: sessionId.value,
      token: authStore.accessToken,
      onOpen: () => {
        wsConnectionState.value = 'OPEN'
        appendSessionLog('ws open')
      },
      onClose: () => {
        if (wsConnectionState.value !== 'DISCONNECTED') {
          wsConnectionState.value = 'CLOSED'
          appendSessionLog('ws close')
        }
      },
      onError: () => {
        wsConnectionState.value = 'ERROR'
        setError('STT WebSocket connection error.')
      },
      onEvent: async (event) => {
        if (event.type === 'CONNECTED') {
          appendSessionLog(event.message || 'audio stream connected')
          return
        }

        if (event.type === 'PARTIAL_TEXT') {
          partialText.value = event.text || ''
          appendSessionLog('partial text received')
          return
        }

        if (event.type === 'FINAL_TEXT') {
          finalText.value = event.text || ''
          appendSessionLog('final text received')

          try {
            await completeSessionIfNeeded(finalText.value)
          } catch (error) {
            setError(normalizeErrorMessage(error, 'Failed to persist final STT text.'))
          }

          return
        }

        if (event.type === 'ERROR') {
          setError(event.message || 'STT server returned an error event.')
        }
      },
    })

    await socketClient.value.waitForOpen()
  }

  function resetRuntimeState() {
    clearPolling()
    errorMessage.value = ''
    partialText.value = ''
    finalText.value = ''
    sessionId.value = ''
    sessionStatus.value = 'IDLE'
    wsConnectionState.value = 'DISCONNECTED'
    recordingState.value = 'IDLE'
    startedAt.value = ''
    endedAt.value = ''
    hasSentCompleteSignal.value = false
    hasRequestedRestCompletion.value = false
    pollingAttempts.value = 0
    resetSttDebugState(audioDebug)
  }

  async function startSession() {
    if (!canStartSession.value) {
      return
    }

    isBusy.value = true

    try {
      await dispose()
      resetRuntimeState()

      const response = await createConsultationSttSession({
        customerId: sessionForm.customerId || null,
        consultationType: sessionForm.consultationType,
      })

      applySessionSnapshot(response?.result)
      appendSessionLog(`session created -> ${response?.result?.sessionId || 'UNKNOWN'}`)
      await connectSocket()
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to start STT session.'))
    } finally {
      isBusy.value = false
    }
  }

  async function reconnectSocket() {
    if (!sessionId.value) {
      return
    }

    isBusy.value = true
    errorMessage.value = ''

    try {
      await connectSocket()
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to reconnect STT WebSocket.'))
    } finally {
      isBusy.value = false
    }
  }

  async function startRecording() {
    if (!canStartRecording.value) {
      return
    }

    errorMessage.value = ''

    try {
      audioCapture.value = await createPcmAudioCapture({
        onChunk: async (payload, meta) => {
          socketClient.value?.sendAudioChunk(payload)
          recordTransportDebug(
            audioDebug,
            {
              payloadType: meta.payloadType,
              byteLength: payload.byteLength,
              incrementChunkCount: true,
            },
            `send ${payload.byteLength} bytes (${meta.outputSampleRate}Hz / ${meta.outputChannelCount}ch / ${meta.bitDepth}bit)`,
          )
        },
        onDebug: handleCaptureDebug,
        onError: (error) => {
          setError(normalizeErrorMessage(error, 'Audio capture failed.'))
        },
      })

      recordCaptureDebug(
        audioDebug,
        {
          mode: audioCapture.value.captureMode,
          inputSampleRate: audioCapture.value.inputSampleRate,
          inputChannelCount: audioCapture.value.inputChannelCount,
          targetSampleRate: audioCapture.value.targetSampleRate,
          targetChannelCount: audioCapture.value.targetChannelCount,
          bitDepth: audioCapture.value.bitDepth,
          payloadType: audioCapture.value.payloadType,
        },
        `capture start (${audioCapture.value.captureMode})`,
      )

      await audioCapture.value.start()
      recordingState.value = 'RECORDING'
      appendSessionLog('recording start')
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to start microphone capture.'))
    }
  }

  async function stopRecording() {
    if (!canStopRecording.value) {
      return
    }

    recordingState.value = 'STOPPING'
    clearPolling()

    try {
      await audioCapture.value?.stop()
      audioCapture.value = null

      if (socketClient.value && !hasSentCompleteSignal.value) {
        socketClient.value.sendComplete()
        hasSentCompleteSignal.value = true
        appendSessionLog('send COMPLETE')
      }

      recordingState.value = 'STOPPED'
      sessionStatus.value = 'PROCESSING'
      pollingAttempts.value = 0
      void pollSessionUntilSettled()
    } catch (error) {
      recordingState.value = 'IDLE'
      setError(normalizeErrorMessage(error, 'Failed to stop microphone capture.'))
    }
  }

  async function dispose() {
    clearPolling()

    try {
      if (recordingState.value === 'RECORDING') {
        await stopRecording()
      }
    } catch {
      // stopRecording already surfaces the error.
    }

    try {
      await audioCapture.value?.dispose()
    } catch {
      // ignore release failures
    }

    audioCapture.value = null
    teardownSocket()
  }

  onBeforeUnmount(() => {
    void dispose()
  })

  return {
    sessionForm,
    sessionId,
    sessionStatus,
    partialText,
    finalText,
    errorMessage,
    wsConnectionState,
    recordingState,
    startedAt,
    endedAt,
    isBusy,
    audioDebug,
    canStartSession,
    canStartRecording,
    canStopRecording,
    startSession,
    reconnectSocket,
    refreshSession,
    startRecording,
    stopRecording,
    dispose,
    resetRuntimeState,
  }
}

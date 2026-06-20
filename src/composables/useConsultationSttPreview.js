import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import { createConsultationSttSession, getConsultationSttSession } from '../api/consultationStt'
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

  const canStartSession = computed(() => {
    return (
      Boolean(sessionForm.consultationType) &&
      !sessionId.value &&
      recordingState.value === 'IDLE' &&
      !isBusy.value
    )
  })
  const canStartRecording = computed(() => {
    return (
      Boolean(sessionId.value) &&
      wsConnectionState.value === 'OPEN' &&
      ['IDLE', 'STOPPED'].includes(recordingState.value) &&
      !isBusy.value
    )
  })
  const canPauseRecording = computed(() => recordingState.value === 'RECORDING' && !isBusy.value)
  const canResumeRecording = computed(() => recordingState.value === 'PAUSED' && !isBusy.value)
  const canStopRecording = computed(() => ['RECORDING', 'PAUSED'].includes(recordingState.value) && !isBusy.value)

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

  async function refreshSession() {
    if (!sessionId.value) {
      return null
    }

    const response = await getConsultationSttSession(sessionId.value)
    applySessionSnapshot(response?.result)
    appendSessionLog(`session fetch -> ${response?.result?.sessionStatus || 'UNKNOWN'}`)
    return response?.result || null
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
      onEvent: (event) => {
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
          sessionStatus.value = 'COMPLETED'
          appendSessionLog('final text received')
          return
        }

        if (event.type === 'ERROR') {
          sessionStatus.value = 'FAILED'
          setError(event.message || 'STT server returned an error event.')
        }
      },
    })

    await socketClient.value.waitForOpen()
  }

  function resetRuntimeState() {
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
    resetSttDebugState(audioDebug)
  }

  async function initializeAudioCapture() {
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
      `capture ready (${audioCapture.value.captureMode})`,
    )
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
      await initializeAudioCapture()
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
    if (recordingState.value === 'PAUSED') {
      return resumeRecording()
    }

    if (!canStartRecording.value) {
      return
    }

    errorMessage.value = ''

    try {
      await audioCapture.value?.start()
      recordingState.value = 'RECORDING'
      startedAt.value = new Date().toISOString()
      appendSessionLog('recording start')
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to start microphone capture.'))
    }
  }

  async function pauseRecording() {
    if (!canPauseRecording.value) {
      return
    }

    try {
      await audioCapture.value?.pause()
      recordingState.value = 'PAUSED'
      appendSessionLog('recording pause')
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to pause microphone capture.'))
    }
  }

  async function resumeRecording() {
    if (!canResumeRecording.value) {
      return
    }

    try {
      await audioCapture.value?.resume()
      recordingState.value = 'RECORDING'
      appendSessionLog('recording resume')
    } catch (error) {
      setError(normalizeErrorMessage(error, 'Failed to resume microphone capture.'))
    }
  }

  async function stopRecording() {
    if (!canStopRecording.value) {
      return
    }

    isBusy.value = true
    recordingState.value = 'STOPPING'

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
      endedAt.value = new Date().toISOString()
    } catch (error) {
      recordingState.value = 'IDLE'
      setError(normalizeErrorMessage(error, 'Failed to stop microphone capture.'))
    } finally {
      isBusy.value = false
    }
  }

  async function dispose() {
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
    canPauseRecording,
    canResumeRecording,
    canStopRecording,
    startSession,
    reconnectSocket,
    refreshSession,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    dispose,
    resetRuntimeState,
  }
}

import { computed, onBeforeUnmount, reactive, ref } from 'vue'

import {
  completeConsultationSttSession,
  createConsultationSttSession,
  getConsultationSttSession,
} from '../api/consultationStt'
import { createConsultationSttSocket } from '../services/stt/consultationSttSocket'
import { createMediaRecorderAudioCapture } from '../services/stt/mediaRecorderAudioCapture'
import { useAuthStore } from '../stores/auth'

const POLLING_INTERVAL_MS = 1500
const MAX_POLLING_ATTEMPTS = 10

function normalizeErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  )
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
  const captureMimeType = ref('')
  const startedAt = ref('')
  const endedAt = ref('')
  const isBusy = ref(false)
  const eventLogs = ref([])

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

  function appendLog(message) {
    eventLogs.value = [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        message,
      },
      ...eventLogs.value,
    ].slice(0, 30)
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
    appendLog(`세션 조회: ${response?.result?.sessionStatus || 'UNKNOWN'}`)
    return response?.result || null
  }

  async function completeSessionIfNeeded(textSource) {
    if (!sessionId.value || !textSource || hasRequestedRestCompletion.value) {
      return null
    }

    const latestSession = await refreshSession()

    if (['COMPLETED', 'FAILED'].includes(latestSession?.sessionStatus)) {
      return latestSession
    }

    hasRequestedRestCompletion.value = true
    appendLog('REST complete 호출 시도')

    try {
      const response = await completeConsultationSttSession(sessionId.value, {
        finalText: textSource,
      })

      applySessionSnapshot(response?.result)
      appendLog(`REST complete 성공: ${response?.result?.sessionStatus || 'UNKNOWN'}`)
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
        appendLog('세션이 COMPLETED 상태로 확정되었습니다.')
        return
      }

      if (latestSession?.sessionStatus === 'FAILED') {
        errorMessage.value = errorMessage.value || 'STT 세션이 실패 상태로 종료되었습니다.'
        return
      }

      pollingTimerId.value = window.setTimeout(pollSessionUntilSettled, POLLING_INTERVAL_MS)
    } catch (error) {
      errorMessage.value = normalizeErrorMessage(error, '세션 상태를 다시 확인하지 못했습니다.')
      appendLog(errorMessage.value)
    }
  }

  function teardownSocket() {
    socketClient.value?.close()
    socketClient.value = null

    if (wsConnectionState.value !== 'DISCONNECTED') {
      wsConnectionState.value = 'DISCONNECTED'
    }
  }

  async function connectSocket() {
    if (!sessionId.value) {
      throw new Error('세션이 아직 생성되지 않았습니다.')
    }

    if (!authStore.accessToken) {
      throw new Error('액세스 토큰이 없어 STT WebSocket을 연결할 수 없습니다.')
    }

    teardownSocket()
    wsConnectionState.value = 'CONNECTING'
    appendLog('WebSocket 연결 시도')

    socketClient.value = createConsultationSttSocket({
      sessionId: sessionId.value,
      token: authStore.accessToken,
      onOpen: () => {
        wsConnectionState.value = 'OPEN'
        appendLog('WebSocket 연결 완료')
      },
      onClose: () => {
        if (wsConnectionState.value !== 'DISCONNECTED') {
          wsConnectionState.value = 'CLOSED'
          appendLog('WebSocket 연결 종료')
        }
      },
      onError: () => {
        wsConnectionState.value = 'ERROR'
        errorMessage.value = 'STT WebSocket 연결 중 오류가 발생했습니다.'
        appendLog(errorMessage.value)
      },
      onEvent: async (event) => {
        if (event.type === 'CONNECTED') {
          appendLog(event.message || 'audio stream connected')
          return
        }

        if (event.type === 'PARTIAL_TEXT') {
          partialText.value = event.text || ''
          appendLog('중간 인식 결과 수신')
          return
        }

        if (event.type === 'FINAL_TEXT') {
          finalText.value = event.text || ''
          appendLog('최종 인식 결과 수신')

          try {
            await completeSessionIfNeeded(finalText.value)
          } catch (error) {
            errorMessage.value = normalizeErrorMessage(error, '최종 텍스트 저장에 실패했습니다.')
            appendLog(errorMessage.value)
          }

          return
        }

        if (event.type === 'ERROR') {
          errorMessage.value = event.message || 'STT 서버에서 오류 이벤트를 전송했습니다.'
          appendLog(errorMessage.value)
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
    captureMimeType.value = ''
    startedAt.value = ''
    endedAt.value = ''
    hasSentCompleteSignal.value = false
    hasRequestedRestCompletion.value = false
    pollingAttempts.value = 0
    eventLogs.value = []
  }

  async function startSession() {
    if (!canStartSession.value) {
      return
    }

    isBusy.value = true

    try {
      await dispose()
      resetRuntimeState()
      errorMessage.value = ''

      const response = await createConsultationSttSession({
        customerId: sessionForm.customerId || null,
        consultationType: sessionForm.consultationType,
      })

      applySessionSnapshot(response?.result)
      appendLog(`세션 시작: ${response?.result?.sessionId || 'UNKNOWN'}`)
      await connectSocket()
    } catch (error) {
      errorMessage.value = normalizeErrorMessage(error, 'STT 세션을 시작하지 못했습니다.')
      appendLog(errorMessage.value)
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
      errorMessage.value = normalizeErrorMessage(error, 'STT WebSocket 재연결에 실패했습니다.')
      appendLog(errorMessage.value)
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
      audioCapture.value = await createMediaRecorderAudioCapture({
        onChunk: (buffer) => {
          socketClient.value?.sendAudioChunk(buffer)
        },
        onError: (error) => {
          errorMessage.value = normalizeErrorMessage(error, '녹음 중 오류가 발생했습니다.')
          appendLog(errorMessage.value)
        },
      })

      captureMimeType.value = audioCapture.value.mimeType
      await audioCapture.value.start()
      recordingState.value = 'RECORDING'
      appendLog(`녹음 시작 (${captureMimeType.value})`)
    } catch (error) {
      errorMessage.value = normalizeErrorMessage(error, '녹음을 시작하지 못했습니다.')
      appendLog(errorMessage.value)
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
        appendLog('COMPLETE 신호 전송')
      }

      recordingState.value = 'STOPPED'
      sessionStatus.value = 'PROCESSING'
      pollingAttempts.value = 0
      pollSessionUntilSettled()
    } catch (error) {
      recordingState.value = 'IDLE'
      errorMessage.value = normalizeErrorMessage(error, '녹음을 종료하지 못했습니다.')
      appendLog(errorMessage.value)
    }
  }

  async function dispose() {
    clearPolling()

    try {
      if (recordingState.value === 'RECORDING') {
        await stopRecording()
      }
    } catch {
      // stopRecording 내부에서 화면에 오류를 노출한다.
    }

    try {
      audioCapture.value?.dispose()
    } catch {
      // 브라우저 리소스 정리 실패는 치명적이지 않다.
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
    captureMimeType,
    startedAt,
    endedAt,
    isBusy,
    eventLogs,
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

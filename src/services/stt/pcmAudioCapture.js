import { createPcm16MonoEncoder } from './pcmAudioTransform'
import { resolveSupportedMediaRecorderMimeType } from './mediaRecorderAudioCapture'

const DEFAULT_TARGET_SAMPLE_RATE = 16000
const WORKLET_BUFFER_SIZE = 2048
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096

function resolveAudioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext || null
}

function createMicrophoneConstraints() {
  return {
    audio: {
      channelCount: {
        ideal: 1,
      },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  }
}

function mixInputBufferToMono(inputBuffer) {
  const channelCount = inputBuffer.numberOfChannels
  const frameCount = inputBuffer.length
  const monoChunk = new Float32Array(frameCount)

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    let mixedValue = 0

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      mixedValue += inputBuffer.getChannelData(channelIndex)[frameIndex] || 0
    }

    monoChunk[frameIndex] = mixedValue / channelCount
  }

  return monoChunk
}

export async function createPcmAudioCapture({
  onChunk,
  onDebug,
  onError,
  fileName = 'recording.webm',
  targetSampleRate = DEFAULT_TARGET_SAMPLE_RATE,
} = {}) {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('이 브라우저는 마이크 캡처를 지원하지 않습니다.')
  }

  const AudioContextConstructor = resolveAudioContextConstructor()

  if (!AudioContextConstructor) {
    throw new Error('이 브라우저는 AudioContext를 지원하지 않습니다.')
  }

  const mediaStream = await navigator.mediaDevices.getUserMedia(createMicrophoneConstraints())
  const audioContext = new AudioContextConstructor()
  const mediaSourceNode = audioContext.createMediaStreamSource(mediaStream)
  const keepAliveGainNode = audioContext.createGain()
  keepAliveGainNode.gain.value = 0
  const recordingMimeType = resolveSupportedMediaRecorderMimeType() || 'audio/webm'
  const mediaRecorder = recordingMimeType
    ? new MediaRecorder(mediaStream, { mimeType: recordingMimeType })
    : new MediaRecorder(mediaStream)

  const pcmEncoder = createPcm16MonoEncoder({
    inputSampleRate: audioContext.sampleRate,
    outputSampleRate: targetSampleRate,
  })

  let captureMode = 'AudioWorklet'
  let processorNode = null
  let stopRequested = false
  let released = false
  let transportPaused = false
  let flushResolver = null
  const pendingChunkTasks = new Set()
  const recordedChunks = []
  let stopRecorderResolver = null

  function normalizeRecordingFileName(mimeType) {
    const fallbackExtension = mimeType.includes('ogg')
      ? 'ogg'
      : mimeType.includes('mp4')
        ? 'mp4'
        : 'webm'
    const sanitizedBaseName = String(fileName || 'recording').replace(/\.[^.]+$/, '')
    return `${sanitizedBaseName}.${fallbackExtension}`
  }

  function emitError(error, fallbackMessage) {
    const resolvedError = error instanceof Error ? error : new Error(fallbackMessage)
    onError?.(resolvedError)
  }

  function enqueueTransportChunk(monoChunk, details = {}) {
    const pendingTask = Promise.resolve()
      .then(async () => {
        if (transportPaused) {
          return
        }

        onDebug?.({
          stage: 'capture',
          details: {
            mode: captureMode,
            inputSampleRate: audioContext.sampleRate,
            inputChannelCount: details.inputChannelCount || mediaSourceNode.channelCount || 1,
            bufferSize: details.bufferSize || monoChunk.length,
          },
          message: `input ${details.inputChannelCount || 1}ch @ ${audioContext.sampleRate}Hz, ${monoChunk.length} frames`,
        })

        const transformedChunk = pcmEncoder.process(monoChunk)

        if (!transformedChunk) {
          return
        }

        onDebug?.({
          stage: 'transform',
          details: transformedChunk.meta,
          message: `pcm ${transformedChunk.meta.outputSampleRate}Hz mono / ${transformedChunk.meta.byteLength} bytes`,
        })

        await onChunk?.(transformedChunk.payload, transformedChunk.meta)
      })
      .catch((error) => {
        emitError(error, 'PCM 변환 중 오류가 발생했습니다.')
      })
      .finally(() => {
        pendingChunkTasks.delete(pendingTask)
      })

    pendingChunkTasks.add(pendingTask)
  }

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (!event.data || event.data.size === 0) {
      return
    }

    recordedChunks.push(event.data)
  })

  mediaRecorder.addEventListener('error', (event) => {
    emitError(event.error || new Error('녹음 파일 생성 중 오류가 발생했습니다.'), '녹음 파일 생성 중 오류가 발생했습니다.')
  })

  mediaRecorder.addEventListener('stop', () => {
    stopRecorderResolver?.()
    stopRecorderResolver = null
  })

  function flushRemainingChunk() {
    const flushedChunk = pcmEncoder.flush()

    if (!flushedChunk) {
      return Promise.resolve()
    }

    onDebug?.({
      stage: 'transform',
      details: flushedChunk.meta,
      message: `flush pcm ${flushedChunk.meta.outputSampleRate}Hz mono / ${flushedChunk.meta.byteLength} bytes`,
    })

    return Promise.resolve(onChunk?.(flushedChunk.payload, flushedChunk.meta)).catch((error) => {
      emitError(error, '마지막 PCM 청크 전송 중 오류가 발생했습니다.')
    })
  }

  async function setupAudioWorklet() {
    if (!audioContext.audioWorklet || typeof AudioWorkletNode === 'undefined') {
      throw new Error('AudioWorklet을 사용할 수 없습니다.')
    }

    const workletModuleUrl = new URL('./worklets/sttPcmCaptureProcessor.js', import.meta.url)
    await audioContext.audioWorklet.addModule(workletModuleUrl.href)

    const workletNode = new AudioWorkletNode(audioContext, 'stt-pcm-capture-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        bufferSize: WORKLET_BUFFER_SIZE,
      },
    })

    workletNode.port.onmessage = (event) => {
      const { data } = event

      if (data?.type === 'chunk' && data.monoBuffer) {
        enqueueTransportChunk(new Float32Array(data.monoBuffer), {
          inputChannelCount: data.channelCount || 1,
          bufferSize: data.frameCount || WORKLET_BUFFER_SIZE,
        })
      }

      if (data?.type === 'flush-complete') {
        flushResolver?.()
        flushResolver = null
      }
    }

    processorNode = workletNode
    mediaSourceNode.connect(workletNode)
    workletNode.connect(keepAliveGainNode)
  }

  function setupScriptProcessorFallback() {
    captureMode = 'ScriptProcessorFallback'

    const scriptProcessorNode = audioContext.createScriptProcessor(
      SCRIPT_PROCESSOR_BUFFER_SIZE,
      Math.max(1, mediaSourceNode.channelCount || 1),
      1,
    )

    scriptProcessorNode.onaudioprocess = (event) => {
      const monoChunk = mixInputBufferToMono(event.inputBuffer)
      enqueueTransportChunk(monoChunk, {
        inputChannelCount: event.inputBuffer.numberOfChannels,
        bufferSize: event.inputBuffer.length,
      })
    }

    processorNode = scriptProcessorNode
    mediaSourceNode.connect(scriptProcessorNode)
    scriptProcessorNode.connect(keepAliveGainNode)
  }

  try {
    await setupAudioWorklet()
  } catch (error) {
    onDebug?.({
      stage: 'capture',
      details: {
        mode: 'ScriptProcessorFallback',
      },
      message: `AudioWorklet unavailable, fallback to ScriptProcessor: ${error.message}`,
    })
    setupScriptProcessorFallback()
  }

  keepAliveGainNode.connect(audioContext.destination)

  onDebug?.({
    stage: 'capture',
    details: {
      mode: captureMode,
      inputSampleRate: audioContext.sampleRate,
      inputChannelCount: mediaSourceNode.channelCount || 1,
      targetSampleRate,
      targetChannelCount: 1,
      bitDepth: 16,
      payloadType: 'ArrayBuffer',
      bufferSize: captureMode === 'AudioWorklet' ? WORKLET_BUFFER_SIZE : SCRIPT_PROCESSOR_BUFFER_SIZE,
    },
    message: `capture ready (${captureMode})`,
  })

  async function start() {
    transportPaused = false
    await audioContext.resume()
    if (mediaRecorder.state === 'inactive') {
      mediaRecorder.start()
    }
  }

  async function pause() {
    if (mediaRecorder.state !== 'recording') {
      return
    }

    transportPaused = true
    mediaRecorder.pause()
  }

  async function resume() {
    if (mediaRecorder.state !== 'paused') {
      return
    }

    transportPaused = false
    mediaRecorder.resume()
  }

  async function stop() {
    if (stopRequested) {
      return createRecordingResult()
    }

    stopRequested = true
    transportPaused = false

    if (captureMode === 'AudioWorklet' && processorNode?.port) {
      await new Promise((resolve) => {
        flushResolver = resolve
        processorNode.port.postMessage({ type: 'flush' })
        window.setTimeout(resolve, 150)
      })
    }

    await Promise.allSettled([...pendingChunkTasks])
    await flushRemainingChunk()
    await stopMediaRecorder()
    await releaseResources()
    return createRecordingResult()
  }

  async function stopMediaRecorder() {
    if (mediaRecorder.state === 'inactive') {
      return
    }

    await new Promise((resolve) => {
      stopRecorderResolver = resolve
      mediaRecorder.stop()
    })
  }

  function createRecordingResult() {
    const mimeType = mediaRecorder.mimeType || recordingMimeType || 'audio/webm'
    const blob = new Blob(recordedChunks, { type: mimeType })

    return {
      blob,
      fileSize: blob.size,
      contentType: mimeType,
      fileName: normalizeRecordingFileName(mimeType),
    }
  }

  async function releaseResources() {
    if (released) {
      return
    }

    released = true

    try {
      processorNode?.disconnect()
    } catch {
      // ignore disconnect failures
    }

    try {
      mediaSourceNode.disconnect()
    } catch {
      // ignore disconnect failures
    }

    try {
      keepAliveGainNode.disconnect()
    } catch {
      // ignore disconnect failures
    }

    if (mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop()
      } catch {
        // ignore recorder stop failures
      }
    }

    mediaStream.getTracks().forEach((track) => track.stop())

    if (audioContext.state !== 'closed') {
      await audioContext.close().catch(() => {})
    }
  }

  return {
    captureMode,
    inputSampleRate: audioContext.sampleRate,
    inputChannelCount: mediaSourceNode.channelCount || 1,
    targetSampleRate,
    targetChannelCount: 1,
    bitDepth: 16,
    payloadType: 'ArrayBuffer',
    recordingMimeType: mediaRecorder.mimeType || recordingMimeType || 'audio/webm',
    async start() {
      await start()
    },
    async pause() {
      await pause()
    },
    async resume() {
      await resume()
    },
    async stop() {
      return stop()
    },
    async dispose() {
      await releaseResources()
    },
  }
}

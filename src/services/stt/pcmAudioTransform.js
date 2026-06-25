const TARGET_CHANNEL_COUNT = 1
const TARGET_BIT_DEPTH = 16
const TARGET_ENDIAN = 'Little Endian'
const TARGET_FORMAT = 'PCM'
const TARGET_PAYLOAD_TYPE = 'ArrayBuffer'

function clampSample(value) {
  return Math.max(-1, Math.min(1, value))
}

function concatFloat32Arrays(left, right) {
  if (!left?.length) {
    return right
  }

  if (!right?.length) {
    return left
  }

  const merged = new Float32Array(left.length + right.length)
  merged.set(left, 0)
  merged.set(right, left.length)
  return merged
}

function convertFloat32ToInt16ArrayBuffer(floatChunk) {
  const buffer = new ArrayBuffer(floatChunk.length * 2)
  const view = new DataView(buffer)

  for (let index = 0; index < floatChunk.length; index += 1) {
    const sample = clampSample(floatChunk[index])
    const int16Value = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(index * 2, Math.round(int16Value), true)
  }

  return buffer
}

export function createPcm16MonoEncoder({ inputSampleRate, outputSampleRate = 16000 } = {}) {
  const ratio = inputSampleRate / outputSampleRate

  if (!Number.isFinite(ratio) || ratio <= 0) {
    throw new Error('유효하지 않은 sample rate 입니다.')
  }

  let bufferedInput = new Float32Array(0)
  let sourceOffset = 0

  function buildMeta(inputFrameCount, outputSampleCount) {
    return {
      format: TARGET_FORMAT,
      inputSampleRate,
      outputSampleRate,
      inputChannelCount: TARGET_CHANNEL_COUNT,
      outputChannelCount: TARGET_CHANNEL_COUNT,
      bitDepth: TARGET_BIT_DEPTH,
      endian: TARGET_ENDIAN,
      payloadType: TARGET_PAYLOAD_TYPE,
      inputFrameCount,
      outputSampleCount,
      byteLength: outputSampleCount * 2,
    }
  }

  function resampleChunk(inputChunk, flush = false) {
    const mergedInput = concatFloat32Arrays(bufferedInput, inputChunk)
    const outputSamples = []

    while (sourceOffset + 1 < mergedInput.length) {
      const baseIndex = Math.floor(sourceOffset)
      const nextIndex = Math.min(baseIndex + 1, mergedInput.length - 1)
      const fraction = sourceOffset - baseIndex
      const interpolatedValue =
        mergedInput[baseIndex] +
        (mergedInput[nextIndex] - mergedInput[baseIndex]) * fraction

      outputSamples.push(interpolatedValue)
      sourceOffset += ratio
    }

    if (flush && mergedInput.length > 0) {
      const lastSample = mergedInput[mergedInput.length - 1]

      while (sourceOffset < mergedInput.length) {
        outputSamples.push(lastSample)
        sourceOffset += ratio
      }
    }

    const consumedSourceFrames = Math.min(Math.floor(sourceOffset), mergedInput.length)
    bufferedInput = mergedInput.slice(consumedSourceFrames)
    sourceOffset -= consumedSourceFrames

    if (flush) {
      bufferedInput = new Float32Array(0)
      sourceOffset = 0
    }

    if (outputSamples.length === 0) {
      return null
    }

    const resampledChunk = Float32Array.from(outputSamples)
    const payload = convertFloat32ToInt16ArrayBuffer(resampledChunk)

    return {
      payload,
      meta: buildMeta(inputChunk.length, resampledChunk.length),
    }
  }

  return {
    process(inputChunk) {
      return resampleChunk(inputChunk, false)
    },
    flush() {
      return resampleChunk(new Float32Array(0), true)
    },
  }
}

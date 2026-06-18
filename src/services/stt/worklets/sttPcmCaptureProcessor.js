class SttPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options = {}) {
    super()

    const configuredBufferSize = Number(options.processorOptions?.bufferSize || 2048)
    this.bufferSize = configuredBufferSize > 0 ? configuredBufferSize : 2048
    this.pendingSamples = new Float32Array(this.bufferSize)
    this.pendingOffset = 0

    this.port.onmessage = (event) => {
      if (event.data?.type === 'flush') {
        this.flushPendingSamples()
        this.port.postMessage({ type: 'flush-complete' })
      }
    }
  }

  flushPendingSamples() {
    if (this.pendingOffset === 0) {
      return
    }

    const chunk = this.pendingSamples.slice(0, this.pendingOffset)
    this.port.postMessage(
      {
        type: 'chunk',
        channelCount: 1,
        frameCount: chunk.length,
        monoBuffer: chunk.buffer,
      },
      [chunk.buffer],
    )
    this.pendingOffset = 0
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]

    if (output?.[0]) {
      output.forEach((channelData) => {
        channelData.fill(0)
      })
    }

    if (!input || input.length === 0 || input[0].length === 0) {
      return true
    }

    const channelCount = input.length
    const frameCount = input[0].length
    let sourceIndex = 0

    while (sourceIndex < frameCount) {
      const writableFrames = Math.min(this.bufferSize - this.pendingOffset, frameCount - sourceIndex)

      for (let frameIndex = 0; frameIndex < writableFrames; frameIndex += 1) {
        let monoSample = 0

        for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
          monoSample += input[channelIndex][sourceIndex + frameIndex] || 0
        }

        this.pendingSamples[this.pendingOffset + frameIndex] = monoSample / channelCount
      }

      this.pendingOffset += writableFrames
      sourceIndex += writableFrames

      if (this.pendingOffset === this.bufferSize) {
        const chunk = this.pendingSamples.slice(0)
        this.port.postMessage(
          {
            type: 'chunk',
            channelCount,
            frameCount: chunk.length,
            monoBuffer: chunk.buffer,
          },
          [chunk.buffer],
        )
        this.pendingOffset = 0
      }
    }

    return true
  }
}

registerProcessor('stt-pcm-capture-processor', SttPcmCaptureProcessor)

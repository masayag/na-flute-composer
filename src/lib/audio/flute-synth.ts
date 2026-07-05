/** Web Audio synthesis tuned for a mellow Native American flute tone. */

export interface FluteSynthNode {
  sources: AudioScheduledSourceNode[]
  outputGain: GainNode
}

interface EnvelopeShape {
  attackSec: number
  releaseSec: number
  peak: number
  sustain: number
}

interface ScheduleOptions {
  /** Glide from this frequency for a subtle NA-flute slide into the target pitch. */
  portamentoFrom?: number
}

function envelopeShape(durationSec: number): EnvelopeShape {
  const attackSec = Math.min(0.22, Math.max(0.08, durationSec * 0.35))
  const releaseSec = Math.min(0.55, Math.max(0.2, durationSec * 0.5))
  return { attackSec, releaseSec, peak: 0.48, sustain: 0.38 }
}

function applyAmplitudeEnvelope(
  gain: GainNode,
  startTime: number,
  durationSec: number,
  shape: EnvelopeShape,
  peakScale = 1,
): number {
  const { attackSec, releaseSec, peak, sustain } = shape
  const scaledPeak = peak * peakScale
  const scaledSustain = sustain * peakScale
  const releaseStart = startTime + Math.max(attackSec, durationSec - releaseSec)
  const endTime = startTime + durationSec + releaseSec

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(scaledPeak, startTime + attackSec)
  gain.gain.setValueAtTime(scaledSustain, releaseStart)
  gain.gain.exponentialRampToValueAtTime(0.001, endTime)

  return endTime
}

/** Karplus-Strong delay-line synthesis — hollow pipe resonance without sustained breath noise. */
function generateBoreResonanceBuffer(
  ctx: AudioContext,
  frequency: number,
  durationSec: number,
  decay = 0.9965,
): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const period = Math.max(2, Math.round(sampleRate / frequency))
  const totalSamples = Math.ceil(sampleRate * durationSec)
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate)
  const output = buffer.getChannelData(0)
  const delayLine = new Float32Array(period)

  for (let i = 0; i < period; i++) {
    delayLine[i] = (Math.random() * 2 - 1) * 0.35 * (1 - i / period)
  }

  let readIndex = 0
  for (let n = 0; n < totalSamples; n++) {
    const nextIndex = (readIndex + 1) % period
    const averaged = 0.5 * (delayLine[readIndex] + delayLine[nextIndex])
    const sample = averaged * decay
    delayLine[readIndex] = sample
    output[n] = sample
    readIndex = nextIndex
  }

  return buffer
}

function schedulePortamentoGlide(
  ctx: AudioContext,
  fromFrequency: number,
  toFrequency: number,
  startTime: number,
  endTime: number,
  destination: AudioNode,
  sources: AudioScheduledSourceNode[],
): void {
  if (fromFrequency <= 0 || Math.abs(fromFrequency - toFrequency) < 1) return

  const glideSec = Math.min(0.09, 0.06 + Math.abs(Math.log2(toFrequency / fromFrequency)) * 0.02)
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(fromFrequency, startTime)
  osc.frequency.exponentialRampToValueAtTime(toFrequency, startTime + glideSec)

  const glideGain = ctx.createGain()
  glideGain.gain.setValueAtTime(0.18, startTime)
  glideGain.gain.exponentialRampToValueAtTime(0.001, startTime + glideSec + 0.04)

  osc.connect(glideGain)
  glideGain.connect(destination)
  osc.start(startTime)
  osc.stop(endTime)
  sources.push(osc)
}

export function scheduleFluteNote(
  ctx: AudioContext,
  startTime: number,
  durationSec: number,
  frequency: number,
  options: ScheduleOptions = {},
): FluteSynthNode {
  const shape = envelopeShape(durationSec)
  const stopBuffer = 0.08
  const endTime = startTime + durationSec + shape.releaseSec + stopBuffer
  const bufferDurationSec = durationSec + shape.releaseSec + stopBuffer

  const toneMix = ctx.createGain()
  toneMix.gain.value = 1

  const toneFilter = ctx.createBiquadFilter()
  toneFilter.type = 'lowpass'
  toneFilter.Q.value = 0.45
  toneFilter.frequency.value = Math.min(3200, Math.max(1800, frequency * 2.8))

  toneMix.connect(toneFilter)

  const masterMix = ctx.createGain()
  masterMix.gain.value = 1
  toneFilter.connect(masterMix)

  const outputGain = ctx.createGain()
  masterMix.connect(outputGain)
  outputGain.connect(ctx.destination)

  const sources: AudioScheduledSourceNode[] = []

  const boreBuffer = generateBoreResonanceBuffer(ctx, frequency, bufferDurationSec)
  const boreSource = ctx.createBufferSource()
  boreSource.buffer = boreBuffer

  const boreGain = ctx.createGain()
  boreGain.gain.value = 0.82
  boreSource.connect(boreGain)
  boreGain.connect(toneMix)
  boreSource.start(startTime)
  boreSource.stop(endTime)
  sources.push(boreSource)

  const bodyOsc = ctx.createOscillator()
  bodyOsc.type = 'sine'
  bodyOsc.frequency.setValueAtTime(frequency, startTime)

  const bodyGain = ctx.createGain()
  bodyGain.gain.value = 0.28
  bodyOsc.connect(bodyGain)
  bodyGain.connect(toneMix)
  bodyOsc.start(startTime)
  bodyOsc.stop(endTime)
  sources.push(bodyOsc)

  const warmthOsc = ctx.createOscillator()
  warmthOsc.type = 'sine'
  warmthOsc.frequency.setValueAtTime(frequency * 2, startTime)

  const warmthGain = ctx.createGain()
  warmthGain.gain.value = 0.04
  warmthOsc.connect(warmthGain)
  warmthGain.connect(toneMix)
  warmthOsc.start(startTime)
  warmthOsc.stop(endTime)
  sources.push(warmthOsc)

  if (options.portamentoFrom) {
    schedulePortamentoGlide(
      ctx,
      options.portamentoFrom,
      frequency,
      startTime,
      endTime,
      toneMix,
      sources,
    )
  }

  applyAmplitudeEnvelope(outputGain, startTime, durationSec, shape)

  return { sources, outputGain }
}

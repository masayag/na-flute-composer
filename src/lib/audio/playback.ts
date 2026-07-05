import { noteDurationBeats } from '../duration-utils'
import type { NoteEvent, Song } from '../types'
import { scheduleFluteNote, type FluteSynthNode } from './flute-synth'
import { fingeringToFrequency } from './pitch'

export const DEFAULT_BPM = 80

export interface PlaybackCallbacks {
  onNoteStart?: (noteId: string) => void
  onEnd?: () => void
}

export class MelodyPlayer {
  private ctx: AudioContext | null = null
  private scheduledNodes: FluteSynthNode[] = []
  private timeouts: ReturnType<typeof setTimeout>[] = []
  private stopped = true
  private onStopCallback?: () => void
  private static active: MelodyPlayer | null = null

  get playing(): boolean {
    return !this.stopped
  }

  async play(song: Song, bpm = DEFAULT_BPM, callbacks: PlaybackCallbacks = {}): Promise<void> {
    MelodyPlayer.active?.stop()
    MelodyPlayer.active = this
    this.onStopCallback = callbacks.onEnd
    this.cleanup()
    this.stopped = false

    const notes = song.measures.flat().filter((n) => n.fingering.holes.length > 0)
    if (notes.length === 0) {
      this.finish()
      return
    }

    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    const beatDuration = 60 / bpm
    let time = this.ctx.currentTime + 0.05
    let lastFrequency: number | undefined

    for (const note of notes) {
      if (this.stopped) break
      this.scheduleNote(song, note, time, beatDuration, callbacks.onNoteStart, lastFrequency)
      const beats = noteDurationBeats(note.duration, note.dotted)
      const frequency = fingeringToFrequency(note.fingering, song.fluteType, song.recommendedKey)
      lastFrequency = frequency
      time += beats * beatDuration
    }

    const endMs = Math.max(0, (time - this.ctx.currentTime) * 1000 + 50)
    const endTimeout = setTimeout(() => {
      if (!this.stopped) this.finish()
    }, endMs)
    this.timeouts.push(endTimeout)
  }

  private scheduleNote(
    song: Song,
    note: NoteEvent,
    startTime: number,
    beatDuration: number,
    onNoteStart?: (noteId: string) => void,
    portamentoFrom?: number,
  ): void {
    if (!this.ctx || this.stopped) return

    const beats = noteDurationBeats(note.duration, note.dotted)
    const durationSec = beats * beatDuration
    const frequency = fingeringToFrequency(note.fingering, song.fluteType, song.recommendedKey)

    const node = scheduleFluteNote(this.ctx, startTime, durationSec, frequency, {
      portamentoFrom,
    })
    this.scheduledNodes.push(node)

    const delayMs = Math.max(0, (startTime - this.ctx.currentTime) * 1000)
    const noteId = note.id
    const timeout = setTimeout(() => {
      if (!this.stopped) onNoteStart?.(noteId)
    }, delayMs)
    this.timeouts.push(timeout)
  }

  stop(): void {
    if (this.stopped) return
    this.finish()
  }

  private finish(): void {
    const notify = !this.stopped
    this.stopped = true
    if (MelodyPlayer.active === this) MelodyPlayer.active = null
    this.cleanup()
    if (notify) this.onStopCallback?.()
    this.onStopCallback = undefined
  }

  private cleanup(): void {
    for (const timeout of this.timeouts) clearTimeout(timeout)
    this.timeouts = []

    for (const { sources, outputGain } of this.scheduledNodes) {
      try {
        outputGain.gain.cancelScheduledValues(0)
        outputGain.gain.setValueAtTime(0, 0)
        for (const source of sources) source.stop()
      } catch {
        /* already stopped */
      }
    }
    this.scheduledNodes = []

    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
    }
  }
}

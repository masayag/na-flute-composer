import type { Duration } from './types'

const DURATION_BEATS: Record<Duration, number> = {
  w: 4,
  h: 2,
  q: 1,
  '8': 0.5,
  '16': 0.25,
}

export function noteDurationBeats(duration: Duration, dotted?: boolean): number {
  const beats = DURATION_BEATS[duration]
  return dotted ? beats * 1.5 : beats
}

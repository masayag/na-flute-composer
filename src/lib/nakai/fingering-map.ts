import type { Fingering, FluteType, NakaiFingeringDef } from '../types'
import { FINGERINGS_5HOLE } from './fingerings-5hole'
import { FINGERINGS_6HOLE } from './fingerings-6hole'

export function getFingeringDefs(fluteType: FluteType): NakaiFingeringDef[] {
  return fluteType === '5-hole' ? FINGERINGS_5HOLE : FINGERINGS_6HOLE
}

export function holesToKey(holes: HoleState[]): string {
  return holes.map((h) => (h === 'closed' ? 'c' : h === 'open' ? 'o' : 'h')).join('')
}

type HoleState = Fingering['holes'][number]

export function fingeringKey(fingering: Fingering): string {
  return holesToKey(fingering.holes)
}

export function findFingeringDef(
  fingering: Fingering,
  fluteType: FluteType,
): NakaiFingeringDef | undefined {
  const key = fingeringKey(fingering)
  return getFingeringDefs(fluteType).find((def) => fingeringKey({ holes: def.holes }) === key)
}

export function fingeringToStaffKey(fingering: Fingering, fluteType: FluteType): string {
  const def = findFingeringDef(fingering, fluteType)
  if (def) return def.staffKey
  return 'f#/4'
}

export function staffKeyToFingering(staffKey: string, fluteType: FluteType): Fingering | undefined {
  const def = getFingeringDefs(fluteType).find((d) => d.staffKey === staffKey)
  return def ? { holes: [...def.holes] } : undefined
}

export function defaultFingering(fluteType: FluteType): Fingering {
  const def = getFingeringDefs(fluteType)[0]
  return { holes: [...def.holes] }
}

export const NAKAI_KEY_SIGNATURE = 'E'

export const DURATION_LABELS: Record<string, string> = {
  w: 'Whole',
  h: 'Half',
  q: 'Quarter',
  '8': 'Eighth',
  '16': '16th',
}

export const DURATION_SYMBOLS: Record<string, string> = {
  w: '𝅝',
  h: '𝅗𝅥',
  q: '♩',
  '8': '♪',
  '16': '𝅘𝅥𝅯',
}

import type { Fingering, FluteType } from '../types'
import { fingeringToStaffKey } from '../nakai/fingering-map'

const PITCH_SEMITONES: Record<string, number> = {
  c: 0,
  'c#': 1,
  d: 2,
  'd#': 3,
  e: 4,
  f: 5,
  'f#': 6,
  g: 7,
  'g#': 8,
  a: 9,
  'a#': 10,
  b: 11,
}

/** Nakai reference fundamental — all holes closed maps to F#. */
const NAKAI_ROOT_SEMITONE = 6

export function parseKeyRootSemitone(key: string): number | undefined {
  const trimmed = key.trim()
  if (!trimmed) return undefined
  const match = trimmed.match(/^([A-Ga-g])([#b♯♭]?)/)
  if (!match) return undefined
  const letter = match[1].toLowerCase()
  const acc = match[2]
  const base: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
  const root = base[letter]
  if (root === undefined) return undefined
  if (acc === '#' || acc === '♯') return (root + 1) % 12
  if (acc === 'b' || acc === '♭') return (root + 11) % 12
  return root
}

export function recommendedKeyTransposeSemitones(recommendedKey?: string): number {
  if (!recommendedKey?.trim()) return 0
  const root = parseKeyRootSemitone(recommendedKey)
  if (root === undefined) return 0
  return root - NAKAI_ROOT_SEMITONE
}

export function staffKeyToFrequency(staffKey: string, transposeSemitones = 0): number {
  const [notePart, octaveStr] = staffKey.split('/')
  const octave = Number(octaveStr)
  const semitone = PITCH_SEMITONES[notePart.toLowerCase()]
  if (semitone === undefined || Number.isNaN(octave)) return 440
  const midi = (octave + 1) * 12 + semitone + transposeSemitones
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function fingeringToFrequency(
  fingering: Fingering,
  fluteType: FluteType,
  recommendedKey?: string,
): number {
  const staffKey = fingeringToStaffKey(fingering, fluteType)
  const transpose = recommendedKeyTransposeSemitones(recommendedKey)
  return staffKeyToFrequency(staffKey, transpose)
}

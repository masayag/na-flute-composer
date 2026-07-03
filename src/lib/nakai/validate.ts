import { FINGERINGS_6HOLE } from './fingerings-6hole'
import { FINGERINGS_5HOLE } from './fingerings-5hole'
import { fingeringKey } from './fingering-map'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

function validateSet(name: string, defs: typeof FINGERINGS_6HOLE): string[] {
  const errors: string[] = []
  const staffKeys = new Set<string>()
  const fingerKeys = new Set<string>()

  for (const def of defs) {
    if (staffKeys.has(def.staffKey)) {
      errors.push(`${name}: duplicate staff key ${def.staffKey}`)
    }
    staffKeys.add(def.staffKey)

    const key = fingeringKey({ holes: def.holes })
    if (fingerKeys.has(key)) {
      errors.push(`${name}: duplicate fingering ${def.name}`)
    }
    fingerKeys.add(key)
  }

  const fundamental = defs[0]
  if (!fundamental?.holes.every((h) => h === 'closed')) {
    errors.push(`${name}: fundamental should have all holes closed`)
  }

  if (fundamental?.staffKey !== 'f#/4') {
    errors.push(`${name}: fundamental should map to f#/4 (Nakai first space)`)
  }

  if (defs.length < 7) {
    errors.push(`${name}: expected at least 7 primary scale fingerings`)
  }

  return errors
}

/** Validates fingering tables against Nakai tablature conventions. */
export function validateNakaiMappings(): ValidationResult {
  const errors = [...validateSet('6-hole', FINGERINGS_6HOLE), ...validateSet('5-hole', FINGERINGS_5HOLE)]
  return { ok: errors.length === 0, errors }
}

if (import.meta.env?.DEV) {
  const result = validateNakaiMappings()
  if (!result.ok) {
    console.warn('[NA Flute Composer] Nakai validation:', result.errors)
  }
}

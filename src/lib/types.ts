export type HoleState = 'closed' | 'open' | 'half'

export interface Fingering {
  holes: HoleState[]
}

export type Duration = 'w' | 'h' | 'q' | '8' | '16'

export interface NoteEvent {
  id: string
  fingering: Fingering
  duration: Duration
  dotted?: boolean
}

export type FluteType = '6-hole' | '5-hole'

export interface Song {
  id: string
  title: string
  composer?: string
  /** Recommended flute key, e.g. "Am", "Gm", "F#m". */
  recommendedKey?: string
  timeSignature: [number, number]
  fluteType: FluteType
  measures: NoteEvent[][]
  createdAt: string
  updatedAt: string
}

export interface NakaiFingeringDef {
  id: string
  name: string
  holes: HoleState[]
  staffKey: string
  description?: string
}

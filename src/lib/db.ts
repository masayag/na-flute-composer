import Dexie, { type EntityTable } from 'dexie'
import type { Song } from './types'

export const db = new Dexie('NAFluteComposer') as Dexie & {
  songs: EntityTable<Song, 'id'>
}

db.version(1).stores({
  songs: 'id, title, updatedAt',
})

export function createEmptySong(overrides?: Partial<Song>): Song {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Melody',
    composer: '',
    timeSignature: [4, 4],
    fluteType: '6-hole',
    measures: [[]],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export async function listSongs(): Promise<Song[]> {
  return db.songs.orderBy('updatedAt').reverse().toArray()
}

export async function getSong(id: string): Promise<Song | undefined> {
  return db.songs.get(id)
}

export async function saveSong(song: Song): Promise<void> {
  await db.songs.put({ ...song, updatedAt: new Date().toISOString() })
}

export async function deleteSong(id: string): Promise<void> {
  await db.songs.delete(id)
}

export async function duplicateSong(id: string): Promise<Song | undefined> {
  const original = await getSong(id)
  if (!original) return undefined
  const copy = createEmptySong({
    title: `${original.title} (copy)`,
    composer: original.composer,
    timeSignature: [...original.timeSignature] as [number, number],
    fluteType: original.fluteType,
    measures: original.measures.map((m) =>
      m.map((n) => ({ ...n, id: crypto.randomUUID(), fingering: { holes: [...n.fingering.holes] } })),
    ),
  })
  await saveSong(copy)
  return copy
}

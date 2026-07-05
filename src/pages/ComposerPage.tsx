import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FluteInput } from '../components/FluteInput'
import { NakaiScore } from '../components/NakaiScore'
import { NoteTimeline } from '../components/NoteTimeline'
import { SongMetaForm } from '../components/SongMetaForm'
import { useAutoSave, useSong } from '../hooks/useSong'
import { usePlayback } from '../hooks/usePlayback'
import { noteDurationBeats } from '../lib/duration-utils'
import { defaultFingering } from '../lib/nakai/fingering-map'
import '../lib/nakai/validate'
import { exportSongToPdf } from '../lib/pdf-export'
import type { Duration, Fingering, NoteEvent, Song } from '../lib/types'

function measureBeats(measure: NoteEvent[]): number {
  return measure.reduce((sum, n) => sum + noteDurationBeats(n.duration, n.dotted), 0)
}

export function ComposerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { song, updateSong, loading, error } = useSong(id)
  const { saving, lastSaved } = useAutoSave(song)
  const { isPlaying, playingNoteId, toggle } = usePlayback(song)

  const [fingering, setFingering] = useState<Fingering>(() => defaultFingering('6-hole'))
  const [duration, setDuration] = useState<Duration>('q')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!song) return
    setFingering(defaultFingering(song.fluteType))
  }, [song?.id, song?.fluteType, song])

  const patchSong = useCallback(
    (updates: Partial<Song>) => {
      updateSong((prev) => ({ ...prev, ...updates }))
    },
    [updateSong],
  )

  const addNote = useCallback(() => {
    if (!song) return
    const newNote: NoteEvent = {
      id: crypto.randomUUID(),
      fingering: { holes: [...fingering.holes] },
      duration,
    }

    updateSong((prev) => {
      const measures = prev.measures.map((m) => [...m])
      if (measures.length === 0) measures.push([])

      let lastIndex = measures.length - 1
      const beatsPerMeasure = prev.timeSignature[0]
      let currentBeats = measureBeats(measures[lastIndex])

      if (currentBeats + noteDurationBeats(duration) > beatsPerMeasure && measures[lastIndex].length > 0) {
        measures.push([])
        lastIndex = measures.length - 1
      }

      measures[lastIndex] = [...measures[lastIndex], newNote]
      return { ...prev, measures }
    })
  }, [song, fingering, duration, updateSong])

  const deleteNote = useCallback(
    (noteId: string) => {
      updateSong((prev) => {
        const measures = prev.measures
          .map((m) => m.filter((n) => n.id !== noteId))
          .filter((m, i, arr) => m.length > 0 || i === arr.length - 1)
        if (measures.length === 0) measures.push([])
        return { ...prev, measures }
      })
      setSelectedNoteId(null)
    },
    [updateSong],
  )

  const selectNote = useCallback(
    (noteId: string) => {
      if (!song) return
      setSelectedNoteId(noteId)
      const note = song.measures.flat().find((n) => n.id === noteId)
      if (note) {
        setFingering({ holes: [...note.fingering.holes] })
        setDuration(note.duration)
      }
    },
    [song],
  )

  const handleExportPdf = async () => {
    if (!song) return
    setExportError(null)
    setExporting(true)
    try {
      const el = document.getElementById('score-export-target')
      if (!el) throw new Error('Score preview not ready')
      await exportSongToPdf(song, el)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-amber-800">
        Loading melody…
      </div>
    )
  }

  if (error || !song) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-amber-900">
        <p>{error ?? 'Song not found'}</p>
        <Link to="/" className="text-amber-700 underline">
          Back to library
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf6f0]">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-amber-700 hover:text-amber-900"
            >
              ← Library
            </button>
            <h1 className="text-lg font-semibold text-amber-950">Composer</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600">
              {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved'}
            </span>
            <button
              type="button"
              onClick={toggle}
              className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium ${
                isPlaying
                  ? 'border border-amber-600 bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'border border-amber-300 bg-white text-amber-800 hover:bg-amber-50'
              }`}
            >
              {isPlaying ? '■ Stop' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="min-h-11 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>
        {exportError && (
          <p className="mx-auto max-w-7xl px-4 pb-2 text-sm text-red-600">{exportError}</p>
        )}
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <SongMetaForm song={song} onChange={patchSong} />

        <div className="grid gap-4 lg:grid-cols-3">
          <FluteInput
            fingering={
              fingering.holes.length === (song.fluteType === '5-hole' ? 5 : 6)
                ? fingering
                : defaultFingering(song.fluteType)
            }
            duration={duration}
            fluteType={song.fluteType}
            onFingeringChange={setFingering}
            onDurationChange={setDuration}
            onAddNote={addNote}
          />

          <NoteTimeline
            measures={song.measures}
            selectedNoteId={selectedNoteId}
            playingNoteId={playingNoteId}
            onSelectNote={selectNote}
            onDeleteNote={deleteNote}
          />

          <div id="score-export-target">
            <h3 className="mb-2 text-sm font-semibold text-amber-900">Score preview</h3>
            <NakaiScore song={song} />
          </div>
        </div>
      </main>
    </div>
  )
}

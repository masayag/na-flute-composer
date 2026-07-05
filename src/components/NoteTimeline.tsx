import type { Duration, NoteEvent } from '../lib/types'
import { DURATION_SYMBOLS } from '../lib/nakai/fingering-map'
import { FingerDiagram } from './FingerDiagram'

interface NoteTimelineProps {
  measures: NoteEvent[][]
  selectedNoteId: string | null
  playingNoteId?: string | null
  onSelectNote: (id: string) => void
  onDeleteNote: (id: string) => void
}

export function NoteTimeline({
  measures,
  selectedNoteId,
  playingNoteId = null,
  onSelectNote,
  onDeleteNote,
}: NoteTimelineProps) {
  if (measures.every((m) => m.length === 0)) {
    return (
      <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-sm text-amber-700">
        No notes yet — add your first note using the flute input.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-auto rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-900">Melody timeline</h3>
      {measures.map((measure, mi) => (
        <div key={mi} className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs font-medium text-amber-600">M{mi + 1}</span>
          {measure.map((note, ni) => (
            <NoteChip
              key={note.id}
              note={note}
              selected={note.id === selectedNoteId}
              playing={note.id === playingNoteId}
              onSelect={() => onSelectNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
              showBar={ni === measure.length - 1 && mi < measures.length - 1}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function NoteChip({
  note,
  selected,
  playing,
  onSelect,
  onDelete,
  showBar,
}: {
  note: NoteEvent
  selected: boolean
  playing: boolean
  onSelect: () => void
  onDelete: () => void
  showBar: boolean
}) {
  return (
    <>
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-h-11 flex-col items-center rounded-lg border px-2 py-1 transition ${
          playing
            ? 'border-green-600 bg-green-100 ring-2 ring-green-400'
            : selected
              ? 'border-amber-600 bg-amber-100 ring-2 ring-amber-400'
              : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
        }`}
      >
        <FingerDiagram fingering={note.fingering} size={36} />
        <span className="text-sm">{DURATION_SYMBOLS[note.duration as Duration]}</span>
      </button>
      {selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
          title="Delete note"
        >
          ✕
        </button>
      )}
      {showBar && <span className="mx-1 text-amber-400">|</span>}
    </>
  )
}

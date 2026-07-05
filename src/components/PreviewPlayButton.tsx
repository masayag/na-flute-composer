import { usePlayback } from '../hooks/usePlayback'
import type { Song } from '../lib/types'

interface PreviewPlayButtonProps {
  song: Song
}

export function PreviewPlayButton({ song }: PreviewPlayButtonProps) {
  const { isPlaying, toggle } = usePlayback(song)
  const hasNotes = song.measures.some((m) => m.length > 0)

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!hasNotes}
      title={hasNotes ? (isPlaying ? 'Stop preview' : 'Play preview') : 'No notes to play'}
      className={`min-h-11 rounded-lg border px-4 py-2 text-sm disabled:opacity-40 ${
        isPlaying
          ? 'border-amber-600 bg-amber-100 text-amber-900 hover:bg-amber-200'
          : 'border-amber-300 text-amber-800 hover:bg-amber-50'
      }`}
    >
      {isPlaying ? '■ Stop' : '▶ Play'}
    </button>
  )
}

import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Song } from '../lib/types'
import { renderScoreWithFingerDiagrams } from '../lib/score-render'
import { FingerDiagram } from './FingerDiagram'

interface NakaiScoreProps {
  song: Song
  className?: string
  id?: string
}

export function NakaiScore({ song, className = '', id }: NakaiScoreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fingerRootsRef = useRef<Root[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    fingerRootsRef.current.forEach((root) => root.unmount())
    fingerRootsRef.current = []

    renderScoreWithFingerDiagrams(container, song)

    const hosts = container.querySelectorAll('.finger-diagram-host')
    hosts.forEach((host) => {
      const noteId = host.getAttribute('data-note-id')
      if (!noteId) return
      const allNotes = song.measures.flat()
      const event = allNotes.find((n) => n.id === noteId)
      if (!event) return
      const root = createRoot(host)
      root.render(<FingerDiagram fingering={event.fingering} size={48} />)
      fingerRootsRef.current.push(root)
    })

    return () => {
      fingerRootsRef.current.forEach((root) => root.unmount())
      fingerRootsRef.current = []
    }
  }, [song])

  return (
    <div
      id={id}
      className={`overflow-x-auto rounded-xl border border-amber-200 bg-white p-4 ${className}`}
    >
      <div className="mb-2 text-xs text-amber-600">
        Nakai tablature — treble clef, 4 sharps. Note positions represent fingerings, not concert pitch.
      </div>
      <div ref={containerRef} className="score-container min-h-[120px]" />
    </div>
  )
}

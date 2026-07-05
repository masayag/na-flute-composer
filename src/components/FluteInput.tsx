import { useCallback, useEffect, useRef } from 'react'
import type { Duration, Fingering, FluteType, HoleState } from '../lib/types'
import { defaultFingering, DURATION_LABELS, DURATION_SYMBOLS } from '../lib/nakai/fingering-map'
import { FingerDiagram } from './FingerDiagram'

interface FluteInputProps {
  fingering: Fingering
  duration: Duration
  fluteType: FluteType
  onFingeringChange: (fingering: Fingering) => void
  onDurationChange: (duration: Duration) => void
  onAddNote: () => void
}

const DURATIONS: Duration[] = ['w', 'h', 'q', '8', '16']

function cycleHoleState(current: HoleState): HoleState {
  return current === 'closed' ? 'open' : current === 'open' ? 'half' : 'closed'
}

export function FluteInput({
  fingering,
  duration,
  fluteType,
  onFingeringChange,
  onDurationChange,
  onAddNote,
}: FluteInputProps) {
  const dragPaintStateRef = useRef<HoleState | null>(null)

  const setHoleState = useCallback(
    (index: number, state: HoleState) => {
      if (fingering.holes[index] === state) return
      const holes = [...fingering.holes]
      holes[index] = state
      onFingeringChange({ holes })
    },
    [fingering.holes, onFingeringChange],
  )

  const handleHolePointerDown = useCallback(
    (index: number) => {
      const paintState = cycleHoleState(fingering.holes[index])
      dragPaintStateRef.current = paintState
      setHoleState(index, paintState)
    },
    [fingering.holes, setHoleState],
  )

  const handleHolePointerEnter = useCallback(
    (index: number) => {
      const paintState = dragPaintStateRef.current
      if (paintState !== null) setHoleState(index, paintState)
    },
    [setHoleState],
  )

  useEffect(() => {
    const endDrag = () => {
      dragPaintStateRef.current = null
    }
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [])

  const setAllHoles = useCallback(
    (state: HoleState) => {
      onFingeringChange({ holes: fingering.holes.map(() => state) })
    },
    [fingering.holes, onFingeringChange],
  )

  const resetFingering = () => onFingeringChange(defaultFingering(fluteType))

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-900">Tap holes to set fingering</h3>
      <FingerDiagram
        fingering={fingering}
        size={120}
        interactive
        onHolePointerDown={handleHolePointerDown}
        onHolePointerEnter={handleHolePointerEnter}
      />
      <p className="text-xs text-amber-700">
        Tap cycles: closed → open → half. Drag to paint the same state.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setAllHoles('closed')}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-50"
          title="Close every hole"
        >
          All closed
        </button>
        <button
          type="button"
          onClick={() => setAllHoles('open')}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-50"
          title="Open every hole"
        >
          All open
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDurationChange(d)}
            className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-lg transition ${
              duration === d
                ? 'border-amber-600 bg-amber-100 text-amber-900'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            title={DURATION_LABELS[d]}
          >
            {DURATION_SYMBOLS[d]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={resetFingering}
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onAddNote}
          className="rounded-lg bg-amber-700 px-6 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          Add Note
        </button>
      </div>
    </div>
  )
}

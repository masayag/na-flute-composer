import { useCallback } from 'react'
import type { Duration, Fingering, FluteType } from '../lib/types'
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

export function FluteInput({
  fingering,
  duration,
  fluteType,
  onFingeringChange,
  onDurationChange,
  onAddNote,
}: FluteInputProps) {
  const holeCount = fluteType === '5-hole' ? 5 : 6

  const toggleHole = useCallback(
    (index: number) => {
      const holes = [...fingering.holes]
      const current = holes[index]
      holes[index] = current === 'closed' ? 'open' : current === 'open' ? 'half' : 'closed'
      onFingeringChange({ holes })
    },
    [fingering.holes, onFingeringChange],
  )

  const resetFingering = () => onFingeringChange(defaultFingering(fluteType))

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-900">Tap holes to set fingering</h3>
      <FingerDiagram
        fingering={fingering}
        size={holeCount === 5 ? 140 : 160}
        interactive
        onHoleToggle={toggleHole}
      />
      <p className="text-xs text-amber-700">Tap cycles: closed → open → half</p>
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

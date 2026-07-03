import type { Fingering } from '../lib/types'

interface FingerDiagramProps {
  fingering: Fingering
  size?: number
  interactive?: boolean
  onHoleToggle?: (index: number) => void
  className?: string
}

export function FingerDiagram({
  fingering,
  size = 48,
  interactive = false,
  onHoleToggle,
  className = '',
}: FingerDiagramProps) {
  const holeCount = fingering.holes.length
  const width = size * 0.55
  const height = size
  const holeRadius = size * 0.09
  const spacing = (height - holeRadius * 2) / (holeCount + 1)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="Flute fingering diagram"
    >
      <rect
        x={width * 0.35}
        y={holeRadius}
        width={width * 0.3}
        height={height - holeRadius * 2}
        rx={width * 0.12}
        fill="#8b6914"
        stroke="#5c4033"
        strokeWidth={1}
      />
      {fingering.holes.map((state, i) => {
        const cy = spacing * (i + 1)
        const cx = width / 2
        const isClosed = state === 'closed'
        const isHalf = state === 'half'
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={holeRadius}
              fill={isClosed ? '#2c1810' : isHalf ? '#2c1810' : '#faf6f0'}
              stroke="#2c1810"
              strokeWidth={1.5}
              style={interactive ? { cursor: 'pointer' } : undefined}
              onClick={interactive && onHoleToggle ? () => onHoleToggle(i) : undefined}
            />
            {isHalf && (
              <line
                x1={cx - holeRadius * 0.7}
                y1={cy}
                x2={cx + holeRadius * 0.7}
                y2={cy}
                stroke="#faf6f0"
                strokeWidth={2}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

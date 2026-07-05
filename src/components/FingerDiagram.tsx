import type { Fingering } from '../lib/types'

const MIN_TOUCH_TARGET_PX = 40
const MIN_TOUCH_RADIUS = MIN_TOUCH_TARGET_PX / 2

export interface FingerDiagramLayout {
  width: number
  height: number
  holeRadius: number
  hitRadius: number
  centerSpacing: number
  topPadding: number
  bodyY: number
  bodyHeight: number
}

export function computeFingerDiagramLayout(
  holeCount: number,
  size: number,
  interactive = false,
): FingerDiagramLayout {
  const holeRadius = Math.max(3, size * 0.065)
  const edgeGap = Math.max(2, size * 0.03)
  const minVisualSpacing = 2 * holeRadius + edgeGap

  const hitRadius = interactive ? Math.max(holeRadius, MIN_TOUCH_RADIUS) : holeRadius
  const centerSpacing = interactive
    ? Math.max(minVisualSpacing, hitRadius * 1.85)
    : minVisualSpacing

  const bodyInset = edgeGap
  const topPadding = bodyInset + holeRadius
  const lastHoleCy =
    holeCount <= 1 ? topPadding : topPadding + centerSpacing * (holeCount - 1)
  const bodyY = topPadding - holeRadius - bodyInset
  const bodyHeight = lastHoleCy + holeRadius + bodyInset - bodyY
  const height = bodyHeight

  const width = Math.max(size * 0.55, hitRadius * 2 + 12)

  return {
    width,
    height,
    holeRadius,
    hitRadius,
    centerSpacing,
    topPadding,
    bodyY,
    bodyHeight,
  }
}

interface FingerDiagramProps {
  fingering: Fingering
  size?: number
  interactive?: boolean
  onHoleToggle?: (index: number) => void
  onHolePointerDown?: (index: number) => void
  onHolePointerEnter?: (index: number) => void
  className?: string
}

export function FingerDiagram({
  fingering,
  size = 48,
  interactive = false,
  onHoleToggle,
  onHolePointerDown,
  onHolePointerEnter,
  className = '',
}: FingerDiagramProps) {
  const holeCount = fingering.holes.length
  const layout = computeFingerDiagramLayout(holeCount, size, interactive)
  const { width, height, holeRadius, hitRadius, centerSpacing, topPadding, bodyY, bodyHeight } =
    layout

  const usePointerHandlers = interactive && (onHolePointerDown ?? onHolePointerEnter)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="Flute fingering diagram"
      style={usePointerHandlers ? { touchAction: 'none' } : undefined}
    >
      <rect
        x={width * 0.35}
        y={bodyY}
        width={width * 0.3}
        height={bodyHeight}
        rx={width * 0.12}
        fill="#8b6914"
        stroke="#5c4033"
        strokeWidth={1}
      />
      {fingering.holes.map((state, i) => {
        const cy = topPadding + centerSpacing * i
        const cx = width / 2
        const isClosed = state === 'closed'
        const isHalf = state === 'half'
        return (
          <g key={i}>
            {interactive && (
              <circle
                cx={cx}
                cy={cy}
                r={hitRadius}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={
                  !usePointerHandlers && onHoleToggle ? () => onHoleToggle(i) : undefined
                }
                onPointerDown={
                  usePointerHandlers && onHolePointerDown
                    ? (event) => {
                        event.preventDefault()
                        onHolePointerDown(i)
                      }
                    : undefined
                }
                onPointerEnter={
                  usePointerHandlers && onHolePointerEnter
                    ? (event) => {
                        if (event.buttons !== 0) onHolePointerEnter(i)
                      }
                    : undefined
                }
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={holeRadius}
              fill={isClosed ? '#2c1810' : isHalf ? '#2c1810' : '#faf6f0'}
              stroke="#2c1810"
              strokeWidth={1.5}
              style={interactive ? { pointerEvents: 'none' } : undefined}
              onClick={
                !interactive && onHoleToggle ? () => onHoleToggle(i) : undefined
              }
            />
            {isHalf && (
              <line
                x1={cx - holeRadius * 0.7}
                y1={cy}
                x2={cx + holeRadius * 0.7}
                y2={cy}
                stroke="#faf6f0"
                strokeWidth={2}
                style={interactive ? { pointerEvents: 'none' } : undefined}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

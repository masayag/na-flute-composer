import { Beam, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'
import { computeFingerDiagramLayout } from '../components/FingerDiagram'
import type { NoteEvent, Song } from './types'
import { fingeringToStaffKey, NAKAI_KEY_SIGNATURE } from './nakai/fingering-map'

export interface ScoreLayout {
  width: number
  height: number
  systems: ScoreSystem[]
}

export interface ScoreSystem {
  y: number
  staveHeight: number
  measureIndices: number[]
  notePositions: NotePosition[]
}

export interface NotePosition {
  noteId: string
  x: number
  y: number
  fingering: NoteEvent['fingering']
}

const STAVE_WIDTH = 520
const STAVE_X = 10
const STAVE_SVG_HEIGHT = 90
/** Clearance below the stave SVG before finger diagrams (note stems reach ~85px). */
const FINGER_DIAGRAM_GAP = 14
const FINGER_DIAGRAM_OFFSET = STAVE_SVG_HEIGHT + FINGER_DIAGRAM_GAP
const SYSTEM_BOTTOM_PADDING = 16

function durationToVex(d: NoteEvent['duration'], dotted?: boolean): string {
  return dotted ? `${d}d` : d
}

function createStaveNotes(notes: NoteEvent[], fluteType: Song['fluteType']): StaveNote[] {
  return notes.map((event) => {
    const staffKey = fingeringToStaffKey(event.fingering, fluteType)
    return new StaveNote({
      keys: [staffKey],
      duration: durationToVex(event.duration, event.dotted),
    })
  })
}

function chunkMeasures<T>(items: T[], perChunk: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += perChunk) {
    chunks.push(items.slice(i, i + perChunk))
  }
  return chunks
}

export function renderScoreWithFingerDiagrams(
  container: HTMLElement,
  song: Song,
): ScoreLayout {
  container.innerHTML = ''

  const nonEmpty = song.measures.some((m) => m.length > 0)
  const measures = nonEmpty ? song.measures.filter((m) => m.length > 0) : [[]]
  const holeCount = song.fluteType === '5-hole' ? 5 : 6
  const fingerLayout = computeFingerDiagramLayout(holeCount, 48)
  const measureChunks = chunkMeasures(
    measures.map((m, index) => ({ measure: m, index })),
    2,
  )

  const systems: ScoreSystem[] = []
  let totalHeight = 20
  const systemHeight =
    FINGER_DIAGRAM_OFFSET + Math.ceil(fingerLayout.height) + SYSTEM_BOTTOM_PADDING
  const systemGap = systemHeight + 8

  measureChunks.forEach((chunk, systemIndex) => {
    const allNotes = chunk.flatMap((c) => c.measure)
    const wrapper = document.createElement('div')
    wrapper.style.position = 'relative'
    wrapper.style.width = `${STAVE_WIDTH + STAVE_X * 2}px`
    wrapper.style.height = `${systemHeight}px`
    wrapper.style.marginBottom = '8px'
    container.appendChild(wrapper)

    const svgDiv = document.createElement('div')
    svgDiv.style.position = 'absolute'
    svgDiv.style.left = '0'
    svgDiv.style.top = '0'
    wrapper.appendChild(svgDiv)

    const renderer = new Renderer(svgDiv, Renderer.Backends.SVG)
    renderer.resize(STAVE_WIDTH + STAVE_X * 2, STAVE_SVG_HEIGHT)
    const ctx = renderer.getContext()

    const stave = new Stave(STAVE_X, 10, STAVE_WIDTH)
    if (systemIndex === 0) {
      stave.addClef('treble')
      stave.addKeySignature(NAKAI_KEY_SIGNATURE)
      stave.addTimeSignature(`${song.timeSignature[0]}/${song.timeSignature[1]}`)
    }
    stave.setContext(ctx).draw()

    const notePositions: NotePosition[] = []

    if (allNotes.length > 0) {
      const staveNotes = createStaveNotes(allNotes, song.fluteType)
      const timeSig = `${song.timeSignature[0]}/${song.timeSignature[1]}`
      const voice = new Voice(timeSig).setMode(Voice.Mode.SOFT).addTickables(staveNotes)
      const beams = Beam.applyAndGetBeams(voice)
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.setContext(ctx).setStave(stave).draw()
      beams.forEach((beam) => beam.setContext(ctx).draw())

      staveNotes.forEach((sn, i) => {
        const event = allNotes[i]
        if (!event) return
        const absX = sn.getAbsoluteX()
        notePositions.push({
          noteId: event.id,
          x: absX,
          y: totalHeight + FINGER_DIAGRAM_OFFSET,
          fingering: event.fingering,
        })

        const fingerHost = document.createElement('div')
        fingerHost.className = 'finger-diagram-host'
        fingerHost.style.position = 'absolute'
        fingerHost.style.left = `${absX - fingerLayout.width / 2}px`
        fingerHost.style.top = `${FINGER_DIAGRAM_OFFSET}px`
        fingerHost.style.width = `${Math.ceil(fingerLayout.width)}px`
        fingerHost.style.height = `${Math.ceil(fingerLayout.height)}px`
        fingerHost.dataset.noteId = event.id
        wrapper.appendChild(fingerHost)
      })
    }

    systems.push({
      y: totalHeight,
      staveHeight: STAVE_SVG_HEIGHT,
      measureIndices: chunk.map((c) => c.index),
      notePositions,
    })

    totalHeight += systemGap
  })

  return {
    width: STAVE_WIDTH + STAVE_X * 2,
    height: Math.max(totalHeight, 120),
    systems,
  }
}

import { createRoot, type Root } from 'react-dom/client'
import { NakaiScore } from '../components/NakaiScore'
import { exportSongToPdf } from './pdf-export'
import type { Song } from './types'

async function waitForScoreRender(): Promise<void> {
  await document.fonts.ready
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50)
      })
    })
  })
}

/** Render score off-screen and export to PDF (for library list without opening composer). */
export async function exportSongToPdfFromLibrary(song: Song): Promise<void> {
  const exportSong: Song = {
    ...song,
    title: song.title.trim() || 'Untitled Melody',
  }

  const mount = document.createElement('div')
  mount.style.position = 'fixed'
  mount.style.left = '-9999px'
  mount.style.top = '0'
  mount.style.width = '800px'
  mount.style.pointerEvents = 'none'
  mount.style.visibility = 'hidden'
  document.body.appendChild(mount)

  let root: Root | null = null
  try {
    root = createRoot(mount)
    root.render(<NakaiScore song={exportSong} />)
    await waitForScoreRender()

    const scoreEl = mount.firstElementChild as HTMLElement | null
    if (!scoreEl) throw new Error('Score preview not ready')

    await exportSongToPdf(exportSong, scoreEl)
  } finally {
    root?.unmount()
    document.body.removeChild(mount)
  }
}

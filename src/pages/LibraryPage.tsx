import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PreviewPlayButton } from '../components/PreviewPlayButton'
import { createEmptySong, deleteSong, duplicateSong, listSongs, saveSong } from '../lib/db'
import { exportSongToPdfFromLibrary } from '../lib/pdf-export-from-song'
import type { Song } from '../lib/types'

export function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const navigate = useNavigate()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSongs(await listSongs())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleNew = async () => {
    const song = createEmptySong()
    await saveSong(song)
    navigate(`/song/${song.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this melody?')) return
    await deleteSong(id)
    refresh()
  }

  const handleDuplicate = async (id: string) => {
    const copy = await duplicateSong(id)
    if (copy) navigate(`/song/${copy.id}`)
    refresh()
  }

  const handleExportPdf = async (song: Song) => {
    setExportError(null)
    setExportingId(song.id)
    try {
      await exportSongToPdfFromLibrary(song)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf6f0]">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-amber-950">NA Flute Composer</h1>
            <p className="text-sm text-amber-700">Compose melodies with Nakai tablature</p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            className="min-h-11 rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800"
          >
            New melody
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        {exportError && (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {exportError}
          </p>
        )}
        {loading ? (
          <p className="text-amber-700">Loading…</p>
        ) : songs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center">
            <p className="mb-4 text-amber-800">No melodies yet.</p>
            <button
              type="button"
              onClick={handleNew}
              className="rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Create your first melody
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {songs.map((song) => (
              <li
                key={song.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <Link
                    to={`/song/${song.id}`}
                    className="font-medium text-amber-950 hover:text-amber-700"
                  >
                    {song.title || 'Untitled Melody'}
                  </Link>
                  {song.composer && (
                    <p className="text-sm text-amber-700">{song.composer}</p>
                  )}
                  {song.recommendedKey && (
                    <p className="text-sm text-amber-600">Key: {song.recommendedKey}</p>
                  )}
                  <p className="text-xs text-amber-500">
                    Updated {new Date(song.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <PreviewPlayButton song={song} />
                  <Link
                    to={`/song/${song.id}`}
                    className="min-h-11 rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    title="Export PDF"
                    onClick={() => handleExportPdf(song)}
                    disabled={exportingId === song.id}
                    className="min-h-11 rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                  >
                    {exportingId === song.id ? 'Exporting…' : 'Export PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(song.id)}
                    className="min-h-11 rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(song.id)}
                    className="min-h-11 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

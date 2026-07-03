import { useCallback, useEffect, useRef, useState } from 'react'
import type { Song } from '../lib/types'
import { getSong, saveSong } from '../lib/db'

export function useSong(id: string | undefined) {
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getSong(id)
      .then((s) => {
        if (cancelled) return
        if (!s) setError('Song not found')
        else setSong(s)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load song')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const updateSong = useCallback((updater: (prev: Song) => Song) => {
    setSong((prev) => (prev ? updater(prev) : prev))
  }, [])

  return { song, setSong, updateSong, loading, error }
}

export function useAutoSave(song: Song | null, delayMs = 800) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    if (!song) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveSong(song)
        setLastSaved(new Date())
      } finally {
        setSaving(false)
      }
    }, delayMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [song, delayMs])

  return { saving, lastSaved }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_BPM, MelodyPlayer } from '../lib/audio/playback'
import type { Song } from '../lib/types'

export function usePlayback(song: Song | null, bpm = DEFAULT_BPM) {
  const playerRef = useRef<MelodyPlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      playerRef.current?.stop()
    }
  }, [])

  const stop = useCallback(() => {
    playerRef.current?.stop()
    playerRef.current = null
    setIsPlaying(false)
    setPlayingNoteId(null)
  }, [])

  const play = useCallback(async () => {
    if (!song) return
    if (playerRef.current?.playing) {
      stop()
      return
    }

    const player = new MelodyPlayer()
    playerRef.current = player
    setIsPlaying(true)
    setPlayingNoteId(null)

    await player.play(song, bpm, {
      onNoteStart: (noteId) => setPlayingNoteId(noteId),
      onEnd: () => {
        setIsPlaying(false)
        setPlayingNoteId(null)
        playerRef.current = null
      },
    })
  }, [song, bpm, stop])

  const toggle = useCallback(() => {
    if (isPlaying) stop()
    else void play()
  }, [isPlaying, play, stop])

  return { isPlaying, playingNoteId, play, stop, toggle }
}

import { COMMON_FLUTE_KEYS } from '../lib/recommended-keys'
import type { FluteType, Song } from '../lib/types'

interface SongMetaFormProps {
  song: Song
  onChange: (updates: Partial<Song>) => void
}

export function SongMetaForm({ song, onChange }: SongMetaFormProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <label className="flex min-w-40 flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Title</span>
        <input
          type="text"
          value={song.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="Melody title"
        />
      </label>
      <label className="flex min-w-40 flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Composer</span>
        <input
          type="text"
          value={song.composer ?? ''}
          onChange={(e) => onChange({ composer: e.target.value })}
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="Your name"
        />
      </label>
      <label className="flex w-24 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Beats</span>
        <input
          type="number"
          min={1}
          max={12}
          value={song.timeSignature[0]}
          onChange={(e) =>
            onChange({
              timeSignature: [Number(e.target.value) || 4, song.timeSignature[1]] as [number, number],
            })
          }
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
      </label>
      <label className="flex w-24 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Beat type</span>
        <select
          value={song.timeSignature[1]}
          onChange={(e) =>
            onChange({
              timeSignature: [song.timeSignature[0], Number(e.target.value)] as [number, number],
            })
          }
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value={2}>2</option>
          <option value={4}>4</option>
          <option value={8}>8</option>
        </select>
      </label>
      <label className="flex min-w-32 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Flute</span>
        <select
          value={song.fluteType}
          onChange={(e) => onChange({ fluteType: e.target.value as FluteType })}
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="6-hole">6-hole</option>
          <option value="5-hole">5-hole</option>
        </select>
      </label>
      <label className="flex min-w-32 flex-col gap-1">
        <span className="text-xs font-medium text-amber-800">Recommended key</span>
        <input
          type="text"
          list="flute-keys"
          value={song.recommendedKey ?? ''}
          onChange={(e) => onChange({ recommendedKey: e.target.value || undefined })}
          className="min-h-11 rounded-lg border border-amber-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          placeholder="e.g. Am, Gm"
        />
        <datalist id="flute-keys">
          {COMMON_FLUTE_KEYS.map((key) => (
            <option key={key} value={key} />
          ))}
        </datalist>
      </label>
    </div>
  )
}

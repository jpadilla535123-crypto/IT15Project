import { useState } from 'react'
import { ChevronDown, User, Building2 } from 'lucide-react'

const AVATAR_COLORS = ['#FF2B66', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#6366F1']

function initials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AvatarSelect({ options, value, onSelect, placeholder, variant = 'person' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value) || null
  const EmptyIcon = variant === 'venue' ? Building2 : User

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
          selected
            ? 'border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E]'
            : 'border-dashed border-gray-300 dark:border-[#2A2A36] bg-transparent'
        }`}
      >
        {selected ? (
          variant === 'venue' ? (
            <span className="h-6 w-6 shrink-0 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center">
              <Building2 size={13} className="text-[#FF2B66]" />
            </span>
          ) : (
            <span
              className="h-6 w-6 shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ backgroundColor: AVATAR_COLORS[(selected.id - 1) % AVATAR_COLORS.length] }}
            >
              {initials(selected.label)}
            </span>
          )
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-lg bg-gray-100 dark:bg-[#121217] flex items-center justify-center text-gray-400 dark:text-[#6B7280]">
            <EmptyIcon size={13} />
          </span>
        )}

        <span className={`flex-1 min-w-0 truncate ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-[#6B7280]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-gray-400 dark:text-[#6B7280]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="blend-scrollbar absolute z-50 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] p-1 shadow-xl">
            {options.map(o => {
              const isSel = o.id === value
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(isSel ? null : o.id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      isSel
                        ? 'bg-[#FF2B66]/10 text-[#FF2B66]'
                        : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {variant === 'venue' ? (
                      <span className="h-6 w-6 shrink-0 rounded-lg bg-[#FF2B66]/10 flex items-center justify-center">
                        <Building2 size={13} className="text-[#FF2B66]" />
                      </span>
                    ) : (
                      <span
                        className="h-6 w-6 shrink-0 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: AVATAR_COLORS[(o.id - 1) % AVATAR_COLORS.length] }}
                      >
                        {initials(o.label)}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{o.label}</span>
                      {o.sub && (
                        <span className="block text-[11px] text-gray-400 dark:text-[#6B7280]">{o.sub}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
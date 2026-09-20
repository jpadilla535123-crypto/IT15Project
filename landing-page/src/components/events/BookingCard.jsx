import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import AvatarSelect from './AvatarSelect'
import { formatCurrency } from '../dashboard/format'

const AVATAR_COLORS = ['#FF2B66', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#6366F1']

function initials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function AssignmentGrid({ rows, teamOptions, venueOptions, onRowChange, disabledTeamOptions, disabledVenueOptions }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">
          Team Member
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#6B7280]">
          Venue
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-[#2A2A36]/60">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2.5">
            <AvatarSelect
              variant="person"
              options={teamOptions}
              value={row.teamId}
              placeholder="Please select a team member"
              disabledOptions={disabledTeamOptions}
              onSelect={id => onRowChange(i, 'teamId', id)}
            />
            <AvatarSelect
              variant="venue"
              options={venueOptions}
              value={row.venueId}
              placeholder="Please select a venue"
              disabledOptions={disabledVenueOptions}
              onSelect={id => onRowChange(i, 'venueId', id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BookingCard({ booking, expandedDefault, teamOptions, venueOptions, rows: controlledRows, onRowsChange, onAddRow, disabledTeamOptions, disabledVenueOptions }) {
  const [expanded, setExpanded] = useState(expandedDefault)
  const [internalRows, setInternalRows] = useState(booking.rows)
  const rows = controlledRows ?? internalRows

  function onRowChange(rowIndex, key, id) {
    const next = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: id } : r))
    if (onRowsChange) onRowsChange(next)
    else setInternalRows(next)
  }

  const assignedTeam = rows.filter(r => r.teamId)

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#121217] px-4 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            Booking — {booking.title}
          </h3>
          <span className="shrink-0 rounded-full bg-gray-100 dark:bg-[#2A2A36] px-2.5 py-0.5 text-[11px] font-medium text-gray-500 dark:text-[#9CA3AF]">
            {booking.timeLabel} · {booking.dateLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!expanded && (
            <div className="hidden sm:flex items-center -space-x-1.5">
              {assignedTeam.slice(0, 3).map(r => {
                const member = teamOptions.find(o => o.id === r.teamId)
                return (
                  <span
                    key={r.teamId}
                    className="h-6 w-6 rounded-full border-2 border-white dark:border-[#121217] text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: AVATAR_COLORS[(r.teamId - 1) % AVATAR_COLORS.length] }}
                  >
                    {member ? initials(member.label) : ''}
                  </span>
                )
              })}
              {assignedTeam.length > 3 && (
                <span className="h-6 min-w-6 px-1 rounded-full border border-gray-200 dark:border-[#2A2A36] bg-white dark:bg-[#0B0B0E] text-[10px] font-semibold text-gray-500 dark:text-[#9CA3AF] flex items-center justify-center">
                  +{assignedTeam.length - 3}
                </span>
              )}
            </div>
          )}

          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Venue Fee: {formatCurrency(booking.fee)}
          </span>

          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Collapse' : 'Expand'}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
              expanded
                ? 'bg-[#FF2B66] text-white'
                : 'border border-gray-200 dark:border-[#2A2A36] text-gray-500 dark:text-[#9CA3AF] hover:text-[#FF2B66]'
            }`}
          >
            {expanded ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-2.5 pb-1">
          <p className="mb-3 text-xs text-gray-400 dark:text-[#6B7280]">
            Booking confirmed on a first come, first served basis. A 30% down payment reserves the venue; the remaining
            balance is due 7 days before the event. Notes content will go here and will not truncate.
          </p>
          <AssignmentGrid rows={rows} teamOptions={teamOptions} venueOptions={venueOptions} onRowChange={onRowChange} disabledTeamOptions={disabledTeamOptions} disabledVenueOptions={disabledVenueOptions} />
          {onAddRow && (
            <button
              type="button"
              onClick={onAddRow}
              className="mt-1 inline-flex items-center gap-1.5 py-2 text-sm font-medium text-gray-400 dark:text-[#6B7280] hover:text-[#FF2B66] transition-colors"
            >
              <Plus size={16} /> Add staff
            </button>
          )}
        </div>
      )}
    </div>
  )
}
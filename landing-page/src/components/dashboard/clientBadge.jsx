export const CLIENT_STATUS_TONES = {
  New: 'bg-[#FF2B66]/10 text-[#FF2B66] dark:bg-[#FF2B66]/15 dark:text-[#FF7A9F]',
  Booked: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  Completed: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  Cancelled: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
}

export default function clientStatusBadge(status) {
  const tone = CLIENT_STATUS_TONES[status] || CLIENT_STATUS_TONES.New
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  )
}
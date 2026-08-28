export default function BookingSectionHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-xs text-gray-400 dark:text-[#6B7280]">{subtitle}</p>
      </div>
    </div>
  )
}
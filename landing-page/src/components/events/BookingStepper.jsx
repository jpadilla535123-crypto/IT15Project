import { CalendarCheck, Building2, UserCog, CreditCard, BadgeCheck, PartyPopper } from 'lucide-react'

export const bookingSteps = [
  { label: 'Booking', icon: CalendarCheck },
  { label: 'Venue', icon: Building2 },
  { label: 'Staff', icon: UserCog },
  { label: 'Payment', icon: CreditCard },
  { label: 'Confirmation', icon: BadgeCheck },
  { label: 'Done', icon: PartyPopper },
]

export default function BookingStepper({ currentStep, onStepChange, steps = bookingSteps }) {
  const cols = { 5: 'grid-cols-5', 6: 'grid-cols-6' }[steps.length] || 'grid-cols-5'
  return (
    <div>
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
      <div className={`grid ${cols} gap-2`} style={{ minWidth: steps.length * 64 }}>
        {steps.map((s, i) => {
          const Icon = s.icon
          const isCurrent = i === currentStep
          const isDone = i < currentStep
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onStepChange(i)}
              className="flex flex-col items-center gap-1.5 outline-none group"
            >
              <span
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent
                    ? 'bg-[#FF2B66] text-white shadow-md shadow-[#FF2B66]/30'
                    : isDone
                      ? 'bg-gray-100 dark:bg-[#121217] text-[#FF2B66]'
                      : 'bg-gray-100 dark:bg-[#121217] text-gray-400 dark:text-[#6B7280]'
                }`}
              >
                <Icon size={17} />
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  isCurrent
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-[#6B7280]'
                }`}
              >
                {s.label}
              </span>
            </button>
          )
        })}
      </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentStep
                ? 'bg-[#FF2B66]/40'
                : i === currentStep
                  ? 'bg-[#FF2B66]'
                  : 'bg-gray-200 dark:bg-[#2A2A36]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
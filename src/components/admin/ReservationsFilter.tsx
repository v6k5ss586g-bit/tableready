'use client'
// src/components/admin/ReservationsFilter.tsx

import { useRouter, usePathname } from 'next/navigation'
import { STATUS_LABELS } from '@/lib/utils'
import type { ReservationStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUSES: (ReservationStatus | '')[] = ['', 'pending', 'approved', 'arrived', 'cancelled', 'no_show', 'rejected']
const STATUS_DISPLAY: Record<string, string> = { '': 'הכל', ...STATUS_LABELS }

interface Props {
  currentDate: string
  currentStatus: string
}

export default function ReservationsFilter({ currentDate, currentStatus }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const navigate = (date: string, status: string) => {
    const params = new URLSearchParams()
    if (date)   params.set('date', date)
    if (status) params.set('status', status)
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="space-y-3">
      <input
        type="date"
        value={currentDate}
        onChange={e => navigate(e.target.value, currentStatus)}
        className="max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => navigate(currentDate, s)}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
              currentStatus === s
                ? 'bg-gold-400 border-gold-400 text-surface-0'
                : 'bg-surface-200 border-surface-400 text-gray-400 hover:text-white hover:border-surface-500'
            )}
          >
            {STATUS_DISPLAY[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

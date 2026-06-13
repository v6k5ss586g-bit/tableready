'use client'
// src/components/admin/ReservationCard.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Users, Clock, CheckCircle, XCircle, UserCheck, Ban, ChevronLeft } from 'lucide-react'
import { cn, STATUS_LABELS, STATUS_COLORS, formatTime } from '@/lib/utils'
import type { Reservation, ReservationStatus } from '@/types'

interface Props {
  reservation: Reservation
  showActions?: boolean
}

const ACTIONS: { status: ReservationStatus; label: string; icon: React.ElementType; className: string }[] = [
  { status: 'approved',  label: 'אשר',      icon: CheckCircle, className: 'text-emerald-400 hover:bg-emerald-400/10 border-emerald-400/20' },
  { status: 'arrived',   label: 'הגיע',      icon: UserCheck,   className: 'text-blue-400 hover:bg-blue-400/10 border-blue-400/20' },
  { status: 'no_show',   label: 'לא הגיע',  icon: Ban,         className: 'text-orange-400 hover:bg-orange-400/10 border-orange-400/20' },
  { status: 'cancelled', label: 'בטל',       icon: XCircle,     className: 'text-red-400 hover:bg-red-400/10 border-red-400/20' },
]

export default function ReservationCard({ reservation: initial, showActions = true }: Props) {
  const router = useRouter()
  const [reservation, setReservation] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (status: ReservationStatus) => {
    setLoading(status)
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReservation(data.reservation)
      toast.success(`סטטוס עודכן ל: ${STATUS_LABELS[status]}`)
      router.refresh()
    } catch {
      toast.error('שגיאה בעדכון הסטטוס')
    } finally {
      setLoading(null)
    }
  }

  const validActions = ACTIONS.filter(a => {
    if (reservation.status === 'cancelled' || reservation.status === 'arrived' || reservation.status === 'no_show') return false
    if (a.status === 'approved' && reservation.status === 'approved') return false
    if (a.status === 'arrived' && reservation.status !== 'approved') return false
    return true
  })

  return (
    <div className="card-sm animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Customer */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-semibold truncate">{reservation.customer?.name}</h3>
            <span className={cn('badge text-xs', STATUS_COLORS[reservation.status])}>
              {STATUS_LABELS[reservation.status]}
            </span>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(reservation.time)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {reservation.party_size} סועדים
            </span>
            {reservation.date !== format(new Date(), 'yyyy-MM-dd') && (
              <span>{format(new Date(reservation.date), 'dd/MM/yyyy', { locale: he })}</span>
            )}
            {reservation.customer?.phone && (
              <a href={`tel:${reservation.customer.phone}`} className="text-gold-400 hover:text-gold-300 transition-colors">
                {reservation.customer.phone}
              </a>
            )}
          </div>

          {reservation.notes && (
            <p className="text-gray-500 text-xs mt-2 line-clamp-2">{reservation.notes}</p>
          )}
        </div>

        <Link href={`/admin/reservations/${reservation.id}`} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Actions */}
      {showActions && validActions.length > 0 && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-surface-300 flex-wrap">
          {validActions.map(({ status, label, icon: Icon, className }) => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={!!loading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                'bg-transparent disabled:opacity-50',
                className
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {loading === status ? '...' : label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

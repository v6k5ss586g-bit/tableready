// src/app/admin/reservations/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import ReservationCard from '@/components/admin/ReservationCard'
import ReservationsFilter from '@/components/admin/ReservationsFilter'
import type { Reservation, ReservationStatus } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ date?: string; status?: string }>
}

export default async function ReservationsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const date   = params.date   || format(new Date(), 'yyyy-MM-dd')
  const status = params.status || ''

  let query = supabase
    .from('reservations')
    .select('*, customer:customers(*)')
    .eq('date', date)
    .order('time')

  if (status) query = query.eq('status', status)

  const { data: reservations } = await query

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">הזמנות</h1>
      </div>

      <ReservationsFilter currentDate={date} currentStatus={status} />

      <div className="space-y-3">
        {!reservations?.length ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">אין הזמנות לתאריך זה</p>
          </div>
        ) : (
          (reservations as Reservation[]).map(r => (
            <ReservationCard key={r.id} reservation={r} showActions />
          ))
        )}
      </div>
    </div>
  )
}

// src/app/admin/reservations/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ReservationCard from '@/components/admin/ReservationCard'
import EditReservationForm from '@/components/admin/EditReservationForm'
import type { Reservation } from '@/types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('reservations')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const reservation = data as Reservation

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <Link href="/admin/reservations" className="hover:text-white transition-colors">הזמנות</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-300">{reservation.customer?.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-white">פרטי הזמנה</h1>

      <ReservationCard reservation={reservation} showActions />

      {/* Customer info */}
      <div className="card space-y-3">
        <h2 className="text-white font-semibold">פרטי לקוח</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">שם</p>
            <Link href={`/admin/customers/${reservation.customer_id}`} className="text-white hover:text-gold-400 transition-colors">
              {reservation.customer?.name}
            </Link>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">טלפון</p>
            <a href={`tel:${reservation.customer?.phone}`} className="text-gold-400">
              {reservation.customer?.phone}
            </a>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">ביקורים</p>
            <p className="text-white">{reservation.customer?.visit_count}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">לא הגיע</p>
            <p className={reservation.customer?.no_show_count ? 'text-red-400' : 'text-white'}>
              {reservation.customer?.no_show_count} פעמים
            </p>
          </div>
        </div>
        {reservation.customer?.notes && (
          <div className="pt-2 border-t border-surface-300">
            <p className="text-gray-400 text-xs mb-0.5">הערות לקוח</p>
            <p className="text-gray-300 text-sm">{reservation.customer.notes}</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="card">
        <h2 className="text-white font-semibold mb-4">עריכה</h2>
        <EditReservationForm reservation={reservation} />
      </div>
    </div>
  )
}

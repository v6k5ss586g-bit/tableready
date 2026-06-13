// src/app/admin/customers/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { ChevronRight, Phone, Star, AlertTriangle } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, formatTime, cn } from '@/lib/utils'
import type { Customer, Reservation } from '@/types'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: reservations }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('reservations').select('*').eq('customer_id', id).order('date', { ascending: false }).limit(30),
  ])

  if (!customer) notFound()

  const c = customer as Customer
  const history = (reservations || []) as Reservation[]

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-1 text-sm text-gray-400">
        <Link href="/admin/customers" className="hover:text-white transition-colors">לקוחות</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-300">{c.name}</span>
      </div>

      {/* Profile */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-400/10 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-400 font-bold text-xl">{c.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{c.name}</h1>
              {c.visit_count >= 5 && (
                <span className="badge text-gold-400 bg-gold-400/10 border-gold-400/20 text-xs flex items-center gap-1">
                  <Star className="w-3 h-3" /> לקוח קבוע
                </span>
              )}
              {c.no_show_count >= 2 && (
                <span className="badge text-orange-400 bg-orange-400/10 border-orange-400/20 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> לא מגיע ({c.no_show_count})
                </span>
              )}
            </div>
            <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 mt-1 text-sm">
              <Phone className="w-3.5 h-3.5" /> {c.phone}
            </a>
            {c.email && <p className="text-gray-400 text-sm mt-0.5">{c.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-surface-300 text-center">
          <div>
            <p className="text-white font-bold text-2xl">{c.visit_count}</p>
            <p className="text-gray-400 text-xs mt-0.5">ביקורים</p>
          </div>
          <div>
            <p className={cn('font-bold text-2xl', c.no_show_count > 0 ? 'text-red-400' : 'text-white')}>
              {c.no_show_count}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">לא הגיע</p>
          </div>
          <div>
            <p className="text-white font-bold text-2xl">{history.length}</p>
            <p className="text-gray-400 text-xs mt-0.5">הזמנות</p>
          </div>
        </div>

        {c.notes && (
          <div className="mt-4 pt-4 border-t border-surface-300">
            <p className="text-gray-400 text-xs mb-1">הערות</p>
            <p className="text-gray-300 text-sm">{c.notes}</p>
          </div>
        )}
      </div>

      {/* Reservation history */}
      <div>
        <h2 className="text-white font-semibold mb-3">היסטוריית הזמנות</h2>
        {!history.length ? (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">אין הזמנות</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(r => (
              <Link key={r.id} href={`/admin/reservations/${r.id}`}
                className="card-sm flex items-center justify-between gap-3 hover:border-surface-400 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">
                      {format(new Date(r.date), 'dd/MM/yyyy', { locale: he })} · {formatTime(r.time)}
                    </span>
                    <span className={cn('badge text-xs', STATUS_COLORS[r.status])}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{r.party_size} סועדים</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

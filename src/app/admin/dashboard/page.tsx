// src/app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { CalendarDays, Users, Clock, AlertCircle } from 'lucide-react'
import ReservationCard from '@/components/admin/ReservationCard'
import type { Reservation } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [
    { data: todayRes },
    { data: upcomingRes },
    { data: pending },
    { data: waiting },
    { data: settings },
  ] = await Promise.all([
    supabase.from('reservations').select('*, customer:customers(*)').eq('date', today)
      .in('status', ['pending','approved','arrived']).order('time'),
    supabase.from('reservations').select('*, customer:customers(*)').gt('date', today)
      .in('status', ['pending','approved']).order('date').order('time').limit(10),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'pending'),
    supabase.from('waiting_list').select('id', { count: 'exact', head: true }).eq('status', 'waiting'),
    supabase.from('restaurant_settings').select('max_seats').single(),
  ])

  const todayGuests = (todayRes || []).reduce((s, r) => s + (r as Reservation).party_size, 0)
  const occupancy   = settings ? Math.round((todayGuests / settings.max_seats) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">דשבורד</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {format(new Date(), "EEEE, d בMMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="הזמנות היום" value={todayRes?.length || 0} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard icon={Users}       label="סועדים היום" value={todayGuests}            color="text-gold-400"  bg="bg-gold-400/10" />
        <StatCard icon={AlertCircle} label="ממתינים לאישור" value={pending?.count || 0} color="text-yellow-400" bg="bg-yellow-400/10" />
        <StatCard icon={Clock}       label="רשימת המתנה"  value={waiting?.count || 0}  color="text-purple-400" bg="bg-purple-400/10" />
      </div>

      {/* Occupancy */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">תפוסה היום</h2>
          <span className="text-gold-400 font-bold text-lg">{occupancy}%</span>
        </div>
        <div className="w-full bg-surface-300 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(occupancy, 100)}%`,
              background: occupancy > 80 ? '#ef4444' : occupancy > 60 ? '#eab308' : '#d4a017',
            }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">{todayGuests} / {settings?.max_seats || 0} מקומות</p>
      </div>

      {/* Today's reservations */}
      <section>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gold-400" />
          הזמנות היום
        </h2>
        {!todayRes?.length ? (
          <EmptyState text="אין הזמנות להיום" />
        ) : (
          <div className="space-y-3">
            {(todayRes as Reservation[]).map(r => (
              <ReservationCard key={r.id} reservation={r} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {!!upcomingRes?.length && (
        <section>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            הזמנות קרובות
          </h2>
          <div className="space-y-3">
            {(upcomingRes as Reservation[]).map(r => (
              <ReservationCard key={r.id} reservation={r} showActions={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string
}) {
  return (
    <div className="card-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white font-bold text-xl leading-tight">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card text-center py-10">
      <p className="text-gray-500">{text}</p>
    </div>
  )
}

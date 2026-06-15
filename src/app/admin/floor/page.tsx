'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Table {
  id: string
  number: string
  capacity: number
  zone: string
  status: string
}

interface Reservation {
  id: string
  time: string
  party_size: number
  status: string
  notes: string | null
  customer: { name: string; phone: string }
}

const ZONE_LABELS: Record<string, string> = {
  inside:  'פנים',
  passage: 'מעבר',
  winter:  'סגירת חורף',
}

const STATUS_COLORS: Record<string, string> = {
  FREE:     'bg-emerald-500/20 border-emerald-500 text-emerald-400',
  OCCUPIED: 'bg-red-500/20 border-red-500 text-red-400',
  RESERVED: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  BLOCKED:  'bg-gray-500/20 border-gray-500 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  FREE:     'פנוי',
  OCCUPIED: 'תפוס',
  RESERVED: 'שמור',
  BLOCKED:  'חסום',
}

const ZONES = ['winter', 'passage', 'inside']

export default function FloorPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [reservations, setReservations] = useState<Record<string, Reservation>>({})
  const [selected, setSelected] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    const [{ data: tablesData }, { data: resData }] = await Promise.all([
      supabase.from('tables').select('*').order('number'),
      supabase
        .from('reservations')
        .select('id, time, party_size, status, notes, table_id, customer:customers(name, phone)')
        .eq('date', today)
        .in('status', ['pending', 'approved', 'arrived']),
    ])

    setTables(tablesData || [])

    const resMap: Record<string, Reservation> = {}
    for (const r of resData || []) {
      if (r.table_id) {
        resMap[r.table_id] = {
          id: r.id,
          time: r.time,
          party_size: r.party_size,
          status: r.status,
          notes: r.notes,
          customer: Array.isArray(r.customer) ? r.customer[0] : r.customer,
        }
      }
    }
    setReservations(resMap)
    setLoading(false)
  }, [today])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tables').update({ status }).eq('id', id)
    setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    setSelected(null)
  }

  const zones = ZONES.map(zone => ({
    key: zone,
    label: ZONE_LABELS[zone],
    tables: tables.filter(t => t.zone === zone),
  }))

  const selectedRes = selected ? reservations[selected.id] : null

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">מפת אולם</h1>
          <p className="text-gray-400 text-sm mt-0.5">לחץ על שולחן לפרטים</p>
        </div>
        <button onClick={loadData} className="btn-ghost text-sm">🔄 רענן</button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full border ${STATUS_COLORS[key].split(' ')[0]} ${STATUS_COLORS[key].split(' ')[1]}`} />
            <span className="text-gray-400 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card text-center py-12"><p className="text-gray-400">טוען...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.map(({ key, label, tables: zoneTables }) => {
            const freeSeats = zoneTables.filter(t => t.status === 'FREE').reduce((s, t) => s + t.capacity, 0)
            return (
              <div key={key} className="card space-y-3">
                <div className="text-center border-b border-surface-300 pb-2">
                  <h2 className="text-white font-semibold">{label}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{freeSeats} מקומות פנויים</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {zoneTables.map(table => {
                    const res = reservations[table.id]
                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelected(selected?.id === table.id ? null : table)}
                        className={`border rounded-lg p-3 text-center transition-all ${STATUS_COLORS[table.status]} ${selected?.id === table.id ? 'ring-2 ring-gold-400' : ''}`}
                      >
                        <div className="font-bold text-lg">{table.number}</div>
                        <div className="text-xs opacity-70">{table.capacity} אנשים</div>
                        <div className="text-xs mt-0.5">{STATUS_LABELS[table.status]}</div>
                        {res && (
                          <div className="text-xs mt-1 font-medium truncate">
                            {res.customer?.name}
                          </div>
                        )}
                        {res && (
                          <div className="text-xs opacity-70">
                            {res.time?.slice(0, 5)} · {res.party_size} אנשים
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected panel */}
      {selected && (
        <div className="card animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">שולחן {selected.number}</h3>
              <p className="text-gray-400 text-sm">{selected.capacity} אנשים · {ZONE_LABELS[selected.zone]}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
          </div>

          {selectedRes ? (
            <div className="bg-surface-200 rounded-lg p-4 mb-4 text-right space-y-2">
              <p className="text-white font-semibold text-lg">{selectedRes.customer?.name}</p>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>⏰ {selectedRes.time?.slice(0, 5)}</span>
                <span>👥 {selectedRes.party_size} סועדים</span>
                <span className="text-yellow-400">{selectedRes.status === 'pending' ? 'ממתין' : selectedRes.status === 'approved' ? 'מאושר' : 'הגיע'}</span>
              </div>
              {selectedRes.customer?.phone && (
                <a href={`tel:${selectedRes.customer.phone}`} className="text-gold-400 text-sm block">
                  📞 {selectedRes.customer.phone}
                </a>
              )}
              {selectedRes.notes && (
                <p className="text-gray-500 text-xs border-t border-surface-300 pt-2">{selectedRes.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4">אין הזמנה פעילה לשולחן זה היום</p>
          )}

          <div>
            <p className="text-gray-400 text-xs mb-2">שנה סטטוס שולחן:</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(selected.id, key)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selected.status === key
                      ? STATUS_COLORS[key]
                      : 'bg-surface-200 border-surface-400 text-gray-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Table {
  id: string
  number: string
  capacity: number
  zone: string
  status: string
  pos_x: number
  pos_y: number
}

interface Reservation {
  id: string
  customer: { name: string; phone: string }
  time: string
  party_size: number
  status: string
  notes: string | null
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
      supabase.from('reservations')
        .select('*, customer:customers(name, phone)')
        .eq('date', today)
        .in('status', ['pending', 'approved', 'arrived']),
    ])

    setTables(tablesData || [])

    // Map table_id to reservation
    const resMap: Record<string, Reservation> = {}
    for (const r of resData || []) {
      if (r.table_id) resMap[r.table_id] = r
    }
    setReservations(resMap)
    setLoading(false)
  }, [today])

  useEffect(() => {
    loadData()
    // Auto refresh every 30 seconds
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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">מפת אולם</h1>
          <p className="text-gray-400 text-sm mt-0.5">לחץ על שולחן לפרטים ושינוי סטטוס</p>
        </div>
        <button onClick={loadData} className="btn-ghost text-sm">רענן</button>
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
        <div className="card text-center py-12">
          <p className="text-gray-400">טוען...</p>
        </div>
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
                        <div className="text-xs mt-1">{STATUS_LABELS[table.status]}</div>
                        {res && (
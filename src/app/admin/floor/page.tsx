'use client'

import { useEffect, useState } from 'react'
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
  const [selected, setSelected] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    const { data } = await supabase.from('tables').select('*').order('number')
    setTables(data || [])
    setLoading(false)
  }

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
      <div>
        <h1 className="text-2xl font-bold text-white">מפת אולם</h1>
        <p className="text-gray-400 text-sm mt-0.5">לחץ על שולחן לשינוי סטטוס</p>
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
        <div className="grid grid-cols-3 gap-4">
          {zones.map(({ key, label, tables: zoneTables }) => (
            <div key={key} className="card space-y-3">
              <h2 className="text-white font-semibold text-center border-b border-surface-300 pb-2">
                {label}
                <span className="text-gray-500 text-xs mr-2">
                  ({zoneTables.filter(t => t.status === 'FREE').reduce((s, t) => s + t.capacity, 0)} מקומות פנויים)
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {zoneTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelected(selected?.id === table.id ? null : table)}
                    className={`border rounded-lg p-3 text-center transition-all ${STATUS_COLORS[table.status]} ${selected?.id === table.id ? 'ring-2 ring-gold-400' : ''}`}
                  >
                    <div className="font-bold text-lg">{table.number}</div>
                    <div className="text-xs">{table.capacity} אנשים</div>
                    <div className="text-xs mt-1">{STATUS_LABELS[table.status]}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status panel */}
      {selected && (
        <div className="card">
          <h3 className="text-white font-semibold mb-3">שולחן {selected.number} — {selected.capacity} אנשים</h3>
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
      )}
    </div>
  )
}
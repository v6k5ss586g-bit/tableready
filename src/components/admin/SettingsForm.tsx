'use client'
// src/components/admin/SettingsForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RestaurantSettings } from '@/types'

interface Props { settings: RestaurantSettings | null }

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export default function SettingsForm({ settings }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:                 settings?.name || '',
    max_seats:            settings?.max_seats || 60,
    reservation_duration: settings?.reservation_duration || 90,
    open_time:            settings?.open_time || '12:00',
    close_time:           settings?.close_time || '23:00',
    slot_interval:        settings?.slot_interval || 30,
    max_party_size:       settings?.max_party_size || 12,
    min_advance_hours:    settings?.min_advance_hours || 2,
    max_advance_days:     settings?.max_advance_days || 30,
    closed_days:          settings?.closed_days || [],
  })

  const toggleDay = (day: number) => {
    setForm(p => ({
      ...p,
      closed_days: p.closed_days.includes(day)
        ? p.closed_days.filter(d => d !== day)
        : [...p.closed_days, day],
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('ההגדרות נשמרו')
      router.refresh()
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
    setForm(p => ({ ...p, [key]: val }))
  }

  return (
    <div className="space-y-5">
      {/* Basic */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold">פרטי המסעדה</h2>
        <div>
          <label className="label">שם המסעדה</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="שם המסעדה" />
        </div>
      </div>

      {/* Capacity */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold">קיבולת</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">מקסימום מקומות ישיבה</label>
            <input type="number" min={1} max={500} value={form.max_seats} onChange={set('max_seats')} />
          </div>
          <div>
            <label className="label">מקסימום אורחים בהזמנה</label>
            <input type="number" min={1} max={50} value={form.max_party_size} onChange={set('max_party_size')} />
          </div>
          <div>
            <label className="label">משך הזמנה (דקות)</label>
            <input type="number" min={30} max={300} step={15} value={form.reservation_duration} onChange={set('reservation_duration')} />
          </div>
          <div>
            <label className="label">רווח בין שעות (דקות)</label>
            <input type="number" min={15} max={120} step={15} value={form.slot_interval} onChange={set('slot_interval')} />
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold">שעות פעילות</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">פתיחה</label>
            <input type="time" value={form.open_time} onChange={set('open_time')} />
          </div>
          <div>
            <label className="label">סגירה</label>
            <input type="time" value={form.close_time} onChange={set('close_time')} />
          </div>
          <div>
            <label className="label">מינימום שעות מראש</label>
            <input type="number" min={0} max={72} value={form.min_advance_hours} onChange={set('min_advance_hours')} />
          </div>
          <div>
            <label className="label">מקסימום ימים מראש</label>
            <input type="number" min={1} max={90} value={form.max_advance_days} onChange={set('max_advance_days')} />
          </div>
        </div>

        {/* Closed days */}
        <div>
          <label className="label">ימי סגירה</label>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                  form.closed_days.includes(i)
                    ? 'bg-red-500/20 border-red-500/30 text-red-400'
                    : 'bg-surface-200 border-surface-400 text-gray-400 hover:text-white'
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 w-full sm:w-auto">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</>
          : <><Save className="w-4 h-4" /> שמור הגדרות</>}
      </button>
    </div>
  )
}

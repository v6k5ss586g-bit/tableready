'use client'
// src/components/admin/EditReservationForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Reservation } from '@/types'

interface Props { reservation: Reservation }

export default function EditReservationForm({ reservation }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date:           reservation.date,
    time:           reservation.time.slice(0, 5),
    party_size:     reservation.party_size,
    notes:          reservation.notes || '',
    internal_notes: reservation.internal_notes || '',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('ההזמנה עודכנה')
      router.refresh()
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">תאריך</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div>
          <label className="label">שעה</label>
          <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
        </div>
        <div>
          <label className="label">סועדים</label>
          <input type="number" min={1} max={50} value={form.party_size}
            onChange={e => setForm(p => ({ ...p, party_size: parseInt(e.target.value) || 1 }))} />
        </div>
      </div>
      <div>
        <label className="label">הערות לקוח</label>
        <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
      <div>
        <label className="label">הערות פנימיות</label>
        <textarea rows={2} value={form.internal_notes} placeholder="נראה רק לצוות..."
          onChange={e => setForm(p => ({ ...p, internal_notes: e.target.value }))} />
      </div>
      <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> שומר...</> : 'שמור שינויים'}
      </button>
    </div>
  )
}

'use client'
// src/components/admin/WaitingListItem.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Users, Calendar, ArrowRightLeft, X } from 'lucide-react'
import type { WaitingEntry } from '@/types'

interface Props { entry: WaitingEntry }

export default function WaitingListItem({ entry }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState<'convert' | 'cancel' | null>(null)
  const [showConvert, setShowConvert] = useState(false)
  const [convertDate, setConvertDate] = useState(entry.date)
  const [convertTime, setConvertTime] = useState(entry.preferred_time?.slice(0, 5) || '19:00')

  const convert = async () => {
    setLoading('convert')
    try {
      const res = await fetch(`/api/waiting-list/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert', date: convertDate, time: convertTime }),
      })
      if (!res.ok) throw new Error()
      toast.success('הומר להזמנה בהצלחה')
      router.refresh()
    } catch {
      toast.error('שגיאה בהמרה')
    } finally {
      setLoading(null)
    }
  }

  const cancel = async () => {
    setLoading('cancel')
    try {
      await fetch(`/api/waiting-list/${entry.id}`, { method: 'DELETE' })
      toast.success('הוסר מרשימת ההמתנה')
      router.refresh()
    } catch {
      toast.error('שגיאה')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card-sm animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold">{entry.customer?.name}</h3>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(entry.date), 'dd/MM/yyyy', { locale: he })}
              {entry.preferred_time && ` · ${entry.preferred_time.slice(0, 5)}`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {entry.party_size} סועדים
            </span>
            <a href={`tel:${entry.customer?.phone}`} className="text-gold-400">
              {entry.customer?.phone}
            </a>
          </div>
          {entry.notes && <p className="text-gray-500 text-xs mt-1.5">{entry.notes}</p>}
        </div>
      </div>

      {/* Convert form */}
      {showConvert && (
        <div className="mt-3 pt-3 border-t border-surface-300 space-y-3">
          <p className="text-white text-sm font-medium">המר להזמנה</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">תאריך</label>
              <input type="date" value={convertDate} onChange={e => setConvertDate(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">שעה</label>
              <input type="time" value={convertTime} onChange={e => setConvertTime(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={convert} disabled={!!loading} className="btn-primary text-sm py-2 flex items-center gap-1.5">
              {loading === 'convert' ? '...' : <><ArrowRightLeft className="w-3.5 h-3.5" /> המר</>}
            </button>
            <button onClick={() => setShowConvert(false)} className="btn-ghost text-sm py-2">ביטול</button>
          </div>
        </div>
      )}

      {!showConvert && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-surface-300">
          <button onClick={() => setShowConvert(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/20 text-emerald-400 hover:bg-emerald-400/10 text-xs font-medium transition-all">
            <ArrowRightLeft className="w-3.5 h-3.5" /> המר להזמנה
          </button>
          <button onClick={cancel} disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 text-xs font-medium transition-all">
            <X className="w-3.5 h-3.5" /> הסר
          </button>
        </div>
      )}
    </div>
  )
}

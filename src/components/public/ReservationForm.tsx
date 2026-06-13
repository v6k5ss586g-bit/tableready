'use client'
// src/components/public/ReservationForm.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays, isBefore, startOfToday } from 'date-fns'
import { toast } from 'sonner'
import { Loader2, Users, Calendar, Clock, MessageSquare, User, Phone } from 'lucide-react'
import type { RestaurantSettings, TimeSlot } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  name:       z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone:      z.string().min(9, 'מספר טלפון לא תקין'),
  date:       z.string().min(1, 'בחר תאריך'),
  time:       z.string().min(1, 'בחר שעה'),
  party_size: z.number().min(1).max(50),
  notes:      z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  settings: RestaurantSettings | null
}

export default function ReservationForm({ settings }: Props) {
  const router = useRouter()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const maxParty = settings?.max_party_size || 12
  const minDate = format(addDays(new Date(), settings?.min_advance_hours && settings.min_advance_hours >= 24 ? 1 : 0), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), settings?.max_advance_days || 30), 'yyyy-MM-dd')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { party_size: 2 },
  })

  const selectedDate = watch('date')
  const selectedTime = watch('time')
  const partySize    = watch('party_size')

  // Load available slots when date or party size changes
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setValue('time', '')
    fetch(`/api/slots?date=${selectedDate}&party_size=${partySize}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => toast.error('שגיאה בטעינת שעות'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, partySize, setValue])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || 'שגיאה')

      const params = new URLSearchParams({
        name:  data.name,
        date:  data.date,
        time:  data.time,
        party: String(data.party_size),
        ...(json.waiting ? { waiting: '1' } : {}),
      })
      router.push(`/reserve/confirm?${params}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשליחת ההזמנה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg animate-slide-up">
      <div className="card space-y-5">

        {/* Party size */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> מספר סועדים
          </label>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: Math.min(maxParty, 10) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setValue('party_size', n)}
                className={cn(
                  'w-10 h-10 rounded-lg border text-sm font-medium transition-all',
                  partySize === n
                    ? 'bg-gold-400 border-gold-400 text-surface-0'
                    : 'bg-surface-200 border-surface-400 text-gray-300 hover:border-gold-400/50'
                )}
              >
                {n}
              </button>
            ))}
            {maxParty > 10 && (
              <input
                type="number"
                min={1}
                max={maxParty}
                value={partySize}
                onChange={e => setValue('party_size', parseInt(e.target.value) || 1)}
                className="w-20"
                placeholder="כמות"
              />
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> תאריך
          </label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            {...register('date')}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* Time slots */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> שעה
          </label>
          {!selectedDate ? (
            <p className="text-gray-500 text-sm py-2">בחר תאריך תחילה</p>
          ) : loadingSlots ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> טוען שעות...
            </div>
          ) : slots.length === 0 ? (
            <p className="text-yellow-400 text-sm py-2">אין שעות פנויות לתאריך זה</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setValue('time', slot.time)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                    !slot.available
                      ? 'opacity-30 cursor-not-allowed bg-surface-200 border-surface-400 text-gray-500'
                      : selectedTime === slot.time
                        ? 'bg-gold-400 border-gold-400 text-surface-0'
                        : 'bg-surface-200 border-surface-400 text-gray-300 hover:border-gold-400/50'
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
          {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
        </div>

        {/* Name */}
        <div>
          <label className="label flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> שם מלא
          </label>
          <input type="text" placeholder="ישראל ישראלי" {...register('name')} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> טלפון
          </label>
          <input type="tel" placeholder="050-0000000" dir="ltr" {...register('phone')} />
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="label flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> הערות (אופציונלי)
          </label>
          <textarea
            rows={3}
            placeholder="אלרגיות, בקשות מיוחדות, יום הולדת..."
            {...register('notes')}
          />
        </div>

        <button type="submit" className="btn-primary w-full text-base flex items-center justify-center gap-2" disabled={submitting}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> שולח...</> : 'שליחת בקשת הזמנה'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        ההזמנה תאושר ע"י הצוות שלנו בהקדם
      </p>
    </form>
  )
}

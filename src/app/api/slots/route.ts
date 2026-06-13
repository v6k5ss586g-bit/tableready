// src/app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date       = searchParams.get('date')
  const partySize  = parseInt(searchParams.get('party_size') || '1')

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('restaurant_settings')
    .select('*')
    .single()

  if (!settings) return NextResponse.json({ slots: [] })

  // Check if day is closed
  const dayOfWeek = new Date(date).getDay()
  if (settings.closed_days?.includes(dayOfWeek)) {
    return NextResponse.json({ slots: [] })
  }

  const times = generateTimeSlots(
    settings.open_time,
    settings.close_time,
    settings.slot_interval,
    settings.reservation_duration
  )

  // Get all active reservations for this date
  const { data: reservations } = await supabase
    .from('reservations')
    .select('time, party_size')
    .eq('date', date)
    .in('status', ['pending', 'approved', 'arrived'])

  // Calculate booked seats per overlapping window for each slot
  const slots = times.map(slotTime => {
    const [sh, sm] = slotTime.split(':').map(Number)
    const slotStart = sh * 60 + sm
    const slotEnd   = slotStart + settings.reservation_duration

    const bookedSeats = (reservations || []).reduce((acc, r) => {
      const [rh, rm] = r.time.split(':').map(Number)
      const rStart = rh * 60 + rm
      const rEnd   = rStart + settings.reservation_duration
      // Overlaps if not (rEnd <= slotStart || rStart >= slotEnd)
      if (rEnd > slotStart && rStart < slotEnd) {
        return acc + r.party_size
      }
      return acc
    }, 0)

    const remaining = settings.max_seats - bookedSeats
    return {
      time:            slotTime,
      available:       remaining >= partySize,
      booked_seats:    bookedSeats,
      remaining_seats: Math.max(0, remaining),
    }
  })

  return NextResponse.json({ slots })
}

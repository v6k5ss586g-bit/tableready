// src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateSchema = z.object({
  name:       z.string().min(2),
  phone:      z.string().min(9),
  date:       z.string(),
  time:       z.string(),
  party_size: z.number().int().min(1),
  notes:      z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
  }

  const { name, phone, date, time, party_size, notes } = parsed.data

  // Use service client for public submissions (bypasses RLS for insert)
  const supabase = await createServiceClient()

  // Get settings for capacity check
  const { data: settings } = await supabase
    .from('restaurant_settings')
    .select('*')
    .single()

  if (!settings) return NextResponse.json({ error: 'שגיאת מערכת' }, { status: 500 })

  // Check capacity
  const { data: reservations } = await supabase
    .from('reservations')
    .select('time, party_size')
    .eq('date', date)
    .in('status', ['pending', 'approved', 'arrived'])

  const [sh, sm] = time.split(':').map(Number)
  const slotStart = sh * 60 + sm
  const slotEnd   = slotStart + settings.reservation_duration

  const bookedSeats = (reservations || []).reduce((acc, r) => {
    const [rh, rm] = r.time.split(':').map(Number)
    const rStart = rh * 60 + rm
    const rEnd   = rStart + settings.reservation_duration
    if (rEnd > slotStart && rStart < slotEnd) return acc + r.party_size
    return acc
  }, 0)

  const hasCapacity = (settings.max_seats - bookedSeats) >= party_size

  // Upsert customer by phone
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert({ name, phone }, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id')
    .single()

  if (custErr || !customer) {
    return NextResponse.json({ error: 'שגיאה ביצירת לקוח' }, { status: 500 })
  }

  if (!hasCapacity) {
    // Add to waiting list
    await supabase.from('waiting_list').insert({
      customer_id:    customer.id,
      date,
      preferred_time: time,
      party_size,
      notes,
    })
    return NextResponse.json({ success: true, waiting: true })
  }

  // Create reservation
  const { error: resErr } = await supabase.from('reservations').insert({
    customer_id: customer.id,
    date,
    time,
    party_size,
    notes,
    status: 'pending',
  })

  if (resErr) return NextResponse.json({ error: 'שגיאה ביצירת הזמנה' }, { status: 500 })

  return NextResponse.json({ success: true, waiting: false })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date   = searchParams.get('date')
  const status = searchParams.get('status')

  let query = supabase
    .from('reservations')
    .select('*, customer:customers(*)')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (date)   query = query.eq('date', date)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reservations: data })
}

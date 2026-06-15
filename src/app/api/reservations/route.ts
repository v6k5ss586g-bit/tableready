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

async function findBestTable(supabase: any, date: string, time: string, partySize: number, duration: number) {
  // Get all tables
  const { data: allTables } = await supabase
    .from('tables')
    .select('*')
    .eq('status', 'FREE')
    .gte('capacity', partySize)
    .order('capacity', { ascending: true })

  if (!allTables?.length) return null

  // Get reservations for this time window
  const { data: reservations } = await supabase
    .from('reservations')
    .select('table_id, party_size, time, zone')
    .eq('date', date)
    .in('status', ['pending', 'approved', 'arrived'])

  // Count occupied seats per zone
  const zoneLoad: Record<string, number> = { inside: 0, passage: 0, winter: 0 }
  const occupiedTables = new Set<string>()

  for (const r of reservations || []) {
    const [rh, rm] = r.time.split(':').map(Number)
    const [sh, sm] = time.split(':').map(Number)
    const rStart = rh * 60 + rm
    const rEnd   = rStart + duration
    const sStart = sh * 60 + sm
    const sEnd   = sStart + duration

    if (rEnd > sStart && rStart < sEnd) {
      if (r.table_id) occupiedTables.add(r.table_id)
      if (r.zone) zoneLoad[r.zone] = (zoneLoad[r.zone] || 0) + r.party_size
    }
  }

  // Get zone capacities
  const zoneCapacity: Record<string, number> = { inside: 36, passage: 10, winter: 36 }

  // Sort zones by load percentage (least loaded first)
  const sortedZones = Object.entries(zoneLoad)
    .map(([zone, load]) => ({ zone, load, pct: load / (zoneCapacity[zone] || 1) }))
    .sort((a, b) => a.pct - b.pct)
    .map(z => z.zone)

  // Find best table in least loaded zone
  for (const zone of sortedZones) {
    const available = allTables.filter(t => 
      t.zone === zone && 
      !occupiedTables.has(t.id) &&
      t.capacity >= partySize
    )
    if (available.length > 0) {
      // Pick smallest suitable table
      return available.sort((a, b) => a.capacity - b.capacity)[0]
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
  }

  const { name, phone, date, time, party_size, notes } = parsed.data
  const supabase = await createServiceClient()

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

  // Upsert customer
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert({ name, phone }, { onConflict: 'phone', ignoreDuplicates: false })
    .select('id')
    .single()

  if (custErr || !customer) {
    return NextResponse.json({ error: 'שגיאה ביצירת לקוח' }, { status: 500 })
  }

  if (!hasCapacity) {
    await supabase.from('waiting_list').insert({
      customer_id:    customer.id,
      date,
      preferred_time: time,
      party_size,
      notes,
    })
    return NextResponse.json({ success: true, waiting: true })
  }

  // Find best table automatically
  const bestTable = await findBestTable(supabase, date, time, party_size, settings.reservation_duration)

  // Create reservation
  const { error: resErr } = await supabase.from('reservations').insert({
    customer_id: customer.id,
    date,
    time,
    party_size,
    notes,
    status: 'pending',
    zone: bestTable?.zone || 'inside',
    table_id: bestTable?.id || null,
  })

  if (resErr) return NextResponse.json({ error: 'שגיאה ביצירת הזמנה' }, { status: 500 })

  // Update table status
  if (bestTable) {
    await supabase.from('tables').update({ status: 'RESERVED' }).eq('id', bestTable.id)
  }

  return NextResponse.json({ 
    success: true, 
    waiting: false,
    table: bestTable ? `שולחן ${bestTable.number}` : null
  })
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
.select('*, customer:customers(*), table:tables(*)')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (date)   query = query.eq('date', date)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reservations: data })
}
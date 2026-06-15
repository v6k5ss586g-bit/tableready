
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

async function findTables(supabase: any, date: string, time: string, partySize: number, duration: number) {
  const { data: allTables } = await supabase
    .from('tables')
    .select('*')
    .order('capacity', { ascending: false })

  if (!allTables?.length) return null

  // Get occupied tables for this time slot
  const { data: reservations } = await supabase
    .from('reservations')
    .select('table_id, table_ids, party_size, time')
    .eq('date', date)
    .in('status', ['pending', 'approved', 'arrived'])

  const occupiedIds = new Set<string>()
  const zoneLoad: Record<string, number> = { inside: 0, passage: 0, winter: 0 }

  for (const r of reservations || []) {
    const [rh, rm] = r.time.split(':').map(Number)
    const [sh, sm] = time.split(':').map(Number)
    const rStart = rh * 60 + rm
    const rEnd   = rStart + duration
    const sStart = sh * 60 + sm
    const sEnd   = sStart + duration

    if (rEnd > sStart && rStart < sEnd) {
      if (r.table_id) occupiedIds.add(r.table_id)
      if (r.table_ids) r.table_ids.forEach((id: string) => occupiedIds.add(id))
      const zone = allTables.find((t: any) => t.id === r.table_id)?.zone
      if (zone) zoneLoad[zone] = (zoneLoad[zone] || 0) + r.party_size
    }
  }

  const freeTables = allTables.filter((t: any) => !occupiedIds.has(t.id))

  // Sort zones by load (least loaded first)
  const sortedZones = Object.entries(zoneLoad)
    .sort((a, b) => a[1] - b[1])
    .map(z => z[0])

  // Try to find single table first
  for (const zone of sortedZones) {
    const single = freeTables
      .filter((t: any) => t.zone === zone && t.capacity >= partySize)
      .sort((a: any, b: any) => a.capacity - b.capacity)[0]
    if (single) return { tables: [single], combined: false }
  }

  // Try combining 2 tables
  for (const zone of sortedZones) {
    const zoneFree = freeTables.filter((t: any) => t.zone === zone)
    for (let i = 0; i < zoneFree.length; i++) {
      for (let j = i + 1; j < zoneFree.length; j++) {
        if (zoneFree[i].capacity + zoneFree[j].capacity >= partySize) {
          return { tables: [zoneFree[i], zoneFree[j]], combined: true }
        }
      }
    }
  }

  // Try combining across zones (passage + inside)
  const passage = freeTables.filter((t: any) => t.zone === 'passage')
  const inside  = freeTables.filter((t: any) => t.zone === 'inside')
  const allFree = [...passage, ...inside]
  for (let i = 0; i < allFree.length; i++) {
    for (let j = i + 1; j < allFree.length; j++) {
      if (allFree[i].capacity + allFree[j].capacity >= partySize) {
        return { tables: [allFree[i], allFree[j]], combined: true }
      }
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

  // Check total capacity
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

  // Find best table(s)
  const result = await findTables(supabase, date, time, party_size, settings.reservation_duration)

  const primaryTable = result?.tables[0] || null
  const secondTable  = result?.tables[1] || null

  // Create reservation
  const { error: resErr } = await supabase.from('reservations').insert({
    customer_id:  customer.id,
    date,
    time,
    party_size,
    notes,
    status:    'pending',
    zone:      primaryTable?.zone || 'inside',
    table_id:  primaryTable?.id || null,
    table_ids: result?.tables.map((t: any) => t.id) || null,
  })

  if (resErr) return NextResponse.json({ error: 'שגיאה ביצירת הזמנה' }, { status: 500 })

  // Update table statuses
  if (primaryTable) {
    await supabase.from('tables').update({ status: 'RESERVED' }).eq('id', primaryTable.id)
  }
  if (secondTable) {
    await supabase.from('tables').update({ status: 'RESERVED' }).eq('id', secondTable.id)
  }

  const tableMsg = result?.combined
    ? `שולחנות ${result.tables.map((t: any) => t.number).join(' + ')}`
    : primaryTable ? `שולחן ${primaryTable.number}` : null

  return NextResponse.json({ success: true, waiting: false, table: tableMsg })
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
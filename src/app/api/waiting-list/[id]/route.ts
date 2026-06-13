// src/app/api/waiting-list/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ConvertSchema = z.object({
  action: z.literal('convert'),
  date:   z.string().optional(),
  time:   z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = ConvertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  // Get the waiting entry
  const { data: entry, error: entryErr } = await supabase
    .from('waiting_list')
    .select('*')
    .eq('id', id)
    .single()

  if (entryErr || !entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const date = parsed.data.date || entry.date
  const time = parsed.data.time || entry.preferred_time || '19:00'

  // Create reservation
  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .insert({
      customer_id: entry.customer_id,
      date,
      time,
      party_size: entry.party_size,
      notes: entry.notes,
      status: 'approved',
    })
    .select('id')
    .single()

  if (resErr || !reservation) return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })

  // Update waiting entry
  await supabase
    .from('waiting_list')
    .update({ status: 'converted', converted_to: reservation.id })
    .eq('id', id)

  return NextResponse.json({ success: true, reservation_id: reservation.id })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await supabase.from('waiting_list').update({ status: 'cancelled' }).eq('id', id)
  return NextResponse.json({ success: true })
}

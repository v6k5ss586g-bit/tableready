// src/app/admin/customers/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Users, Star } from 'lucide-react'
import CustomerSearch from '@/components/admin/CustomerSearch'
import type { Customer } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('customers').select('*').order('visit_count', { ascending: false })
  if (params.q) query = query.or(`name.ilike.%${params.q}%,phone.ilike.%${params.q}%`)

  const { data: customers } = await query.limit(100)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">לקוחות</h1>
          <p className="text-gray-400 text-sm mt-0.5">{customers?.length || 0} לקוחות</p>
        </div>
      </div>

      <CustomerSearch initialQ={params.q || ''} />

      <div className="space-y-2">
        {!customers?.length ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">לא נמצאו לקוחות</p>
          </div>
        ) : (
          (customers as Customer[]).map(c => (
            <Link key={c.id} href={`/admin/customers/${c.id}`}
              className="card-sm flex items-center justify-between gap-3 hover:border-surface-400 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold-400 font-semibold text-sm">{c.name[0]}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-medium truncate">{c.name}</p>
                    {c.visit_count >= 5 && <Star className="w-3 h-3 text-gold-400 flex-shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{c.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="text-white font-semibold text-sm">{c.visit_count}</p>
                  <p className="text-gray-500 text-xs">ביקורים</p>
                </div>
                {c.no_show_count > 0 && (
                  <div className="text-center hidden sm:block">
                    <p className="text-red-400 font-semibold text-sm">{c.no_show_count}</p>
                    <p className="text-gray-500 text-xs">לא הגיע</p>
                  </div>
                )}
                <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

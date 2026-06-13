// src/app/admin/waiting-list/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import WaitingListItem from '@/components/admin/WaitingListItem'
import type { WaitingEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function WaitingListPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('waiting_list')
    .select('*, customer:customers(*)')
    .eq('status', 'waiting')
    .order('created_at')

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">רשימת המתנה</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {entries?.length || 0} רשומות ממתינות
        </p>
      </div>

      {!entries?.length ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">רשימת ההמתנה ריקה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(entries as WaitingEntry[]).map(entry => (
            <WaitingListItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

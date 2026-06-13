// src/app/(public)/reserve/page.tsx
import { createClient } from '@/lib/supabase/server'
import ReservationForm from '@/components/public/ReservationForm'
import type { RestaurantSettings } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ReservePage() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('restaurant_settings')
    .select('*')
    .single()

  return (
    <main className="min-h-screen bg-surface-0 flex flex-col items-center justify-start px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-medium mb-4">
          ✦ הזמנת שולחן
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {settings?.name || 'המסעדה שלנו'}
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          הזמינו שולחן בקלות ומהר — אנחנו מחכים לכם
        </p>
      </div>

      <ReservationForm settings={settings as RestaurantSettings} />
    </main>
  )
}

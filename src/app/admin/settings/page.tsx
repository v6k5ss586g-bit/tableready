// src/app/admin/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'
import type { RestaurantSettings } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('restaurant_settings').select('*').single()

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">הגדרות</h1>
        <p className="text-gray-400 text-sm mt-0.5">הגדרות המסעדה ומערכת ההזמנות</p>
      </div>
      <SettingsForm settings={settings as RestaurantSettings} />
    </div>
  )
}

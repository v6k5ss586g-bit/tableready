'use client'
// src/components/admin/CustomerSearch.tsx

import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useTransition } from 'react'

interface Props { initialQ: string }

export default function CustomerSearch({ initialQ }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  return (
    <div className="relative">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        type="text"
        defaultValue={initialQ}
        placeholder="חיפוש לפי שם או טלפון..."
        className="pr-9"
        onChange={e => {
          startTransition(() => {
            const q = e.target.value
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            router.push(`${pathname}?${params}`)
          })
        }}
      />
    </div>
  )
}

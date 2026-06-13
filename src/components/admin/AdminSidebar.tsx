'use client'
// src/components/admin/AdminSidebar.tsx

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CalendarDays, Clock, Users, Settings, LogOut, Menu, X, ChefHat
} from 'lucide-react'
import type { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin:    'מנהל ראשי',
  manager:  'מנהל',
  hostess:  'מארחת',
}

const NAV = [
  { href: '/admin/dashboard',     label: 'דשבורד',           icon: LayoutDashboard },
  { href: '/admin/reservations',  label: 'הזמנות',            icon: CalendarDays },
  { href: '/admin/waiting-list',  label: 'רשימת המתנה',       icon: Clock },
 { href: '/admin/floor',         label: 'מפת אולם',           icon: LayoutDashboard },
 { href: '/admin/customers',     label: 'לקוחות',            icon: Users },
  { href: '/admin/settings',      label: 'הגדרות',            icon: Settings },
]

interface Props {
  user: { email: string; name: string; role: UserRole }
}

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open,   setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-surface-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-400/20 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ניהול הזמנות</p>
            <p className="text-gray-500 text-xs">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn('sidebar-link', pathname.startsWith(href) && 'active')}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-surface-300">
        <div className="px-4 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{user.name}</p>
          <p className="text-gray-500 text-xs truncate">{user.email}</p>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          יציאה
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 right-0 h-full w-64 bg-surface-50 border-l border-surface-300 flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface-50 border-b border-surface-300 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-gold-400" />
          <span className="text-white font-semibold text-sm">ניהול הזמנות</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
          <aside className="md:hidden fixed top-0 right-0 h-full w-64 bg-surface-50 border-l border-surface-300 flex flex-col z-50 animate-slide-up">
            <div className="h-14" />
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Mobile top padding spacer */}
      <div className="md:hidden h-14" />
    </>
  )
}

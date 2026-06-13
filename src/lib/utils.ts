// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, addMinutes } from 'date-fns'
import { he } from 'date-fns/locale'
import type { ReservationStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: he })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} ${formatTime(time)}`
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  const base = new Date(2000, 0, 1, openH, openM)
  const end = new Date(2000, 0, 1, closeH, closeM)
  const lastSlot = addMinutes(end, -durationMinutes)

  let current = base
  while (current <= lastSlot) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, intervalMinutes)
  }
  return slots
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending:   'ממתין',
  approved:  'מאושר',
  rejected:  'נדחה',
  cancelled: 'בוטל',
  arrived:   'הגיע',
  no_show:   'לא הגיע',
}

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  approved:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  rejected:  'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled: 'text-surface-500 bg-surface-300/50 border-surface-400/20',
  arrived:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  no_show:   'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('972')) return '+' + cleaned
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned.replace(/^0(\d{2})(\d{3})(\d{4})$/, '0$1-$2-$3')
  }
  return phone
}

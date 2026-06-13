// src/types/index.ts

export type UserRole = 'admin' | 'manager' | 'hostess'
export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'arrived' | 'no_show'
export type WaitingStatus = 'waiting' | 'converted' | 'cancelled' | 'expired'

export interface RestaurantSettings {
  id: string
  name: string
  max_seats: number
  reservation_duration: number
  open_time: string
  close_time: string
  slot_interval: number
  max_party_size: number
  min_advance_hours: number
  max_advance_days: number
  closed_days: number[]
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  tags: string[]
  visit_count: number
  no_show_count: number
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  customer_id: string
  date: string
  time: string
  party_size: number
  status: ReservationStatus
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  arrived_at: string | null
  cancelled_at: string | null
  customer?: Customer
}

export interface WaitingEntry {
  id: string
  customer_id: string
  date: string
  preferred_time: string | null
  party_size: number
  notes: string | null
  status: WaitingStatus
  converted_to: string | null
  created_at: string
  updated_at: string
  customer?: Customer
}

export interface Staff {
  id: string
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TimeSlot {
  time: string
  available: boolean
  booked_seats: number
  remaining_seats: number
}

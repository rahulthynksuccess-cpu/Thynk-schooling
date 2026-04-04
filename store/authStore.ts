'use client'
import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser:         (user: User) => void
  setAccessToken:  (token: string) => void
  logout:          () => Promise<void>
  refreshUser:     () => Promise<void>
  _hydrate:        () => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       false,

  // Called once from Providers useEffect — reads localStorage safely after mount
  _hydrate: () => {
    try {
      const raw = localStorage.getItem('ts-auth')
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.user) set({ user: saved.user, accessToken: saved.accessToken, isAuthenticated: true })
      }
    } catch (_) {}
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true })
    try {
      const prev = JSON.parse(localStorage.getItem('ts-auth') || '{}')
      localStorage.setItem('ts-auth', JSON.stringify({ ...prev, user }))
    } catch (_) {}
  },

  setAccessToken: (token) => {
    set({ accessToken: token })
    try {
      const prev = JSON.parse(localStorage.getItem('ts-auth') || '{}')
      localStorage.setItem('ts-auth', JSON.stringify({ ...prev, accessToken: token }))
      localStorage.setItem('ts_access_token', token)
    } catch (_) {}
  },

  logout: async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }) } catch (_) {}
    set({ user: null, accessToken: null, isAuthenticated: false })
    try { localStorage.removeItem('ts-auth'); localStorage.removeItem('ts_access_token') } catch (_) {}
    window.location.href = '/login'
  },

  refreshUser: async () => {
    try {
      set({ isLoading: true })
      const res = await fetch('/api/auth/refresh', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      // Always update the access token; update user only if the server returned one
      if (data.accessToken) get().setAccessToken(data.accessToken)
      if (data.user)        get().setUser(data.user)
    } catch (_) {
      set({ user: null, accessToken: null, isAuthenticated: false })
      try { localStorage.removeItem('ts-auth'); localStorage.removeItem('ts_access_token') } catch {}
    } finally {
      set({ isLoading: false })
    }
  },
}))

'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isLoading:       false,
      // Note: actual values are hydrated from localStorage after mount via rehydrate()

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAccessToken: (token) => {
        if (typeof window !== 'undefined')
          localStorage.setItem('ts_access_token', token)
        set({ accessToken: token })
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch (_) {}
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ts_access_token')
        }
        set({ user: null, accessToken: null, isAuthenticated: false })
        if (typeof window !== 'undefined') window.location.href = '/login'
      },

      refreshUser: async () => {
        try {
          set({ isLoading: true })
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) throw new Error('Refresh failed')
          const data = await res.json()
          get().setUser(data.user)
          get().setAccessToken(data.accessToken)
        } catch (_) {
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'ts-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
      skipHydration: true,
    }
  )
)

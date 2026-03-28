'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { apiPost } from '@/lib/api'

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

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAccessToken: (token) => {
        if (typeof window !== 'undefined')
          localStorage.setItem('ts_access_token', token)
        set({ accessToken: token })
      },

      logout: async () => {
        try { await apiPost('/auth/logout') } catch (_) {}
        localStorage.removeItem('ts_access_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
        window.location.href = '/login'
      },

      refreshUser: async () => {
        try {
          set({ isLoading: true })
          const data = await apiPost<{ user: User; accessToken: string }>('/auth/refresh')
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
    }
  )
)

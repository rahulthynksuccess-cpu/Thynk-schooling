'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { config } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:           5 * 60 * 1000,
        gcTime:              10 * 60 * 1000,
        retry:               1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    // Hydrate auth state from localStorage after mount — safe, no SSR conflict
    useAuthStore.getState()._hydrate()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111830', color: '#fff',
            border: '1px solid #1E2A52', borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
          },
          success: { iconTheme: { primary: '#FF5C00', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 4000,
        }}
      />
      {config.app.isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

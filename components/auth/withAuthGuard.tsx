'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export function useAuthGuard(allowedRoles?: string[]) {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace('/login')
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Wrong role — redirect to their dashboard
      if (user.role === 'school_admin') router.replace('/dashboard/school')
      else if (user.role === 'super_admin') router.replace('/admin')
      else router.replace('/dashboard/parent')
    }
  }, [user, accessToken, router, allowedRoles])

  return { user, isAuthorized: !!accessToken && !!user && (!allowedRoles || allowedRoles.includes(user?.role)) }
}

export const authHeaders = () => {
  if (typeof window === 'undefined') return {}

  try {
    const raw = localStorage.getItem('ts-auth')
    const parsed = raw ? JSON.parse(raw) : null

    const token =
      localStorage.getItem('ts_access_token') ||
      parsed?.accessToken

    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {}
  } catch {
    return {}
  }
}

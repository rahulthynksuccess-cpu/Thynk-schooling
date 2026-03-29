import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { config } from './config'

const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // sends httpOnly refresh-token cookie
})

// ── Request interceptor: attach JWT access token ──────────────
api.interceptors.request.use(
  (req) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ts_access_token')
      if (token && req.headers) {
        req.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return req
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: auto-refresh on 401 ─────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers)
              originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/auth/refresh')
        const newToken = res.data.accessToken
        localStorage.setItem('ts_access_token', newToken)
        processQueue(null, newToken)
        if (originalRequest.headers)
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null)
        localStorage.removeItem('ts_access_token')
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ── Typed API helpers ─────────────────────────────────────────
export const apiGet    = <T>(url: string, params?: object)       => api.get<T>(url, { params }).then(r => r.data)
export const apiPost   = <T>(url: string, data?: object)         => api.post<T>(url, data).then(r => r.data)
export const apiPut    = <T>(url: string, data?: object)         => api.put<T>(url, data).then(r => r.data)
export const apiDelete = <T>(url: string)                        => api.delete<T>(url).then(r => r.data)
export const apiPatch  = <T>(url: string, data?: object)         => api.patch<T>(url, data).then(r => r.data)

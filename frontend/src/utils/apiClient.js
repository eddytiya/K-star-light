import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2987/api'

export const apiClient = axios.create({ baseURL: API_URL })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization === `Bearer ${localStorage.getItem('adminToken')}` &&
      localStorage.getItem('adminToken')
    ) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminProfile')
      window.dispatchEvent(new Event('admin-session-expired'))
    }
    return Promise.reject(error)
  }
)

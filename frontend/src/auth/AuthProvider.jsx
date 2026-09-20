import { useEffect, useMemo, useState } from 'react'
import AuthContext from './authContext'
import { apiClient } from '../utils/apiClient'

const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('adminProfile')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    const expired = () => setAdmin(null)
    window.addEventListener('admin-session-expired', expired)
    return () => window.removeEventListener('admin-session-expired', expired)
  }, [])

  const value = useMemo(
    () => ({
      admin,
      login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password })
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminProfile', JSON.stringify(data.admin))
        setAdmin(data.admin)
      },
      logout: () => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminProfile')
        setAdmin(null)
      }
    }),
    [admin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

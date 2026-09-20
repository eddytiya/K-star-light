import { Navigate, useLocation } from 'react-router-dom'
import useAuth from './useAuth'

const ProtectedRoute = ({ children }) => {
  const { admin } = useAuth()
  const location = useLocation()
  return admin ? children : <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
}

export default ProtectedRoute

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { showError } from '../../utils/toastUtils'
import useAuth from '../../auth/useAuth'
import './admin.css'

const AdminLogin = () => {
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const submit = async (event) => {
    event.preventDefault(); setLoading(true)
    try { await login(email, password); navigate(location.state?.from || '/admin') }
    catch (error) { showError(error.response?.data?.message || 'Could not log in') }
    finally { setLoading(false) }
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit}><span className="eyebrow">K STAR LIGHT</span><h1>Admin login</h1><p>Manage products, stock and quotation enquiries.</p><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button><Link to="/">← Return to catalogue</Link></form></main>
}

export default AdminLogin

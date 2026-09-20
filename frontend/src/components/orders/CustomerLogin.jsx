import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { showError, showSuccess } from '../../utils/toastUtils'
import PublicNav from '../catalogue/PublicNav'
import GoogleButton from './GoogleButton'
import './orders.css'

const ownerEmail = 'adityapathak987@gmail.com'

const CustomerLogin = () => {
  const [register, setRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [busy, setBusy] = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const finish = (data) => {
    localStorage.setItem('customerToken', data.token)
    localStorage.setItem('customerProfile', JSON.stringify(data.customer))
    const next = params.get('next')
    navigate(next?.startsWith('/') && !next.startsWith('//') ? next : '/my-orders')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (form.email.trim().toLowerCase() === ownerEmail) { navigate('/admin/login', { state: { email: ownerEmail } }); return }
    setBusy(true)
    try {
      const { data } = await apiClient.post(`/customer-auth/${register ? 'register' : 'login'}`, form)
      showSuccess(register ? 'Account created' : 'Welcome back')
      finish(data)
    } catch (error) { if (error.response?.data?.adminRedirect) navigate('/admin/login', { state: { email: ownerEmail } }); else showError(error.response?.data?.message || 'Could not sign in') }
    finally { setBusy(false) }
  }
  const googleSignIn = async (credential) => {
    setBusy(true)
    try { const { data } = await apiClient.post('/customer-auth/google', { credential }); showSuccess('Signed in with Google'); finish(data) }
    catch (error) { if (error.response?.data?.adminRedirect) navigate('/admin/login', { state: { email: ownerEmail } }); else showError(error.response?.data?.message || 'Google sign-in failed') }
    finally { setBusy(false) }
  }
  return <><PublicNav /><main className="customer-auth"><form onSubmit={submit}><Link className="brand" to="/"><span>K</span> STAR LIGHT</Link><h1>{register ? 'Create account' : 'Welcome back'}</h1><p>Sign in to see orders linked to your verified email. You can also check out as a guest.</p>
    <GoogleButton onCredential={googleSignIn} text={register ? 'signup_with' : 'signin_with'} />
    <div className="auth-divider">or use email</div>
    {register && <><label>Name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Phone<input autoComplete="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label></>}
    <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Password<input required type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><button disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
    <p className="switch-auth">{register ? 'Already have an account?' : 'New customer?'} <button type="button" onClick={() => setRegister(!register)}>{register ? 'Sign in' : 'Create account'}</button></p>
  </form></main></>
}

export default CustomerLogin

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { showError, showSuccess } from '../../utils/toastUtils'
import PublicNav from '../catalogue/PublicNav'
import GoogleButton from './GoogleButton'
import './orders.css'

const CustomerAccount = () => {
  const [profile, setProfile] = useState(null)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('customerToken')
  useEffect(() => {
    if (!token) { navigate('/login?next=%2Faccount', { replace: true }); return }
    apiClient.get('/customer-auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(({ data }) => setProfile(data.customer)).catch(() => showError('Could not load account'))
  }, [navigate, token])
  const requestCode = async () => {
    setBusy(true)
    try { await apiClient.post('/customer-auth/verify-email/request', {}, { headers: { Authorization: `Bearer ${token}` } }); setSent(true); showSuccess('Verification code sent') }
    catch (error) { showError(error.response?.data?.message || 'Could not send code') }
    finally { setBusy(false) }
  }
  const confirmCode = async (event) => {
    event.preventDefault(); setBusy(true)
    try { const { data } = await apiClient.post('/customer-auth/verify-email/confirm', { code }, { headers: { Authorization: `Bearer ${token}` } }); setProfile(data.customer); localStorage.setItem('customerProfile', JSON.stringify(data.customer)); showSuccess('Email verified. Your earlier guest orders are now in My orders.') }
    catch (error) { showError(error.response?.data?.message || 'Could not verify code') }
    finally { setBusy(false) }
  }
  const linkGoogle = async (credential) => {
    setBusy(true)
    try { const { data } = await apiClient.post('/customer-auth/google/link', { credential }, { headers: { Authorization: `Bearer ${token}` } }); setProfile(data.customer); localStorage.setItem('customerProfile', JSON.stringify(data.customer)); showSuccess('Google account connected') }
    catch (error) { showError(error.response?.data?.message || 'Could not connect Google') }
    finally { setBusy(false) }
  }
  return <><PublicNav /><main className="checkout-page account-page"><Link to="/my-orders">← My orders</Link><h1>My account</h1>{profile ? <div className="account-card"><h2>{profile.name}</h2><p>{profile.email}</p><p>{profile.emailVerified ? '✓ Email verified — orders placed with this email appear in My orders.' : 'Verify your email to see guest orders placed with this address on any device.'}</p>{!profile.emailVerified && <div className="verify-email"><button type="button" disabled={busy} onClick={requestCode}>{sent ? 'Send another code' : 'Send verification code'}</button>{sent && <form onSubmit={confirmCode}><label>Six-digit code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} /></label><button disabled={busy}>Verify email</button></form>}</div>}<h3>Connect Google</h3><p>Use the Google account with the same email to sign in next time.</p><GoogleButton onCredential={linkGoogle} text="continue_with" /></div> : <p>Loading account…</p>}</main></>
}

export default CustomerAccount

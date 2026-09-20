import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../auth/useAuth'

const links = [
  ['/admin', 'Overview'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/enquiries', 'Enquiries'],
  ['/admin/orders', 'Orders'],
  ['/admin/manual-orders', 'Manual orders'],
  ['/admin/customers', 'Customers']
]

const AdminNav = () => {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.dataset.theme = next
  }
  return <header className="admin-nav">
    <NavLink className="admin-brand" to="/admin" onClick={() => setMenuOpen(false)}><span className="admin-brand-mark">K</span><span>STAR LIGHT <small>ADMIN</small></span></NavLink>
    <button className="admin-menu-button" type="button" aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'} aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? 'Close' : 'Menu'}</button>
    <nav id="admin-navigation" className={menuOpen ? 'open' : ''} aria-label="Admin navigation">{links.map(([path, label]) => <NavLink key={path} to={path} end={path === '/admin'} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}<NavLink to="/" onClick={() => setMenuOpen(false)}>View site ↗</NavLink></nav>
    <div className="admin-nav-actions"><button className="admin-theme" type="button" onClick={toggleTheme}>{theme === 'light' ? '☾ Dark' : '☀ Light'}</button><button className="admin-logout" type="button" onClick={() => { logout(); navigate('/') }}>Sign out<span>{admin?.name}</span></button></div>
  </header>
}

export default AdminNav

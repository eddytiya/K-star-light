import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { readCart } from '../../utils/cart'

const PublicNav = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [open, setOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(() => Boolean(localStorage.getItem('customerToken')))
  const [cartCount, setCartCount] = useState(() =>
    readCart().reduce((sum, item) => sum + item.quantity, 0)
  )
  useEffect(() => {
    const refresh = () => setCartCount(readCart().reduce((sum, item) => sum + item.quantity, 0))
    window.addEventListener('cartChanged', refresh)
    return () => window.removeEventListener('cartChanged', refresh)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])
  return (
    <header className="public-nav">
      <Link className="brand" to="/" onClick={() => setOpen(false)}>
        <span>K</span> STAR LIGHT
      </Link>
      <button
        className="nav-menu-button"
        type="button"
        aria-expanded={open}
        aria-label="Toggle menu"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      <nav className={open ? 'open' : ''} aria-label="Main navigation">
        <a href="/#catalogue" onClick={() => setOpen(false)}>
          Products
        </a>
        <Link to="/contact" onClick={() => setOpen(false)}>
          Contact
        </Link>
        <Link to="/my-orders" onClick={() => setOpen(false)}>
          My orders
        </Link>
        <Link to="/cart" onClick={() => setOpen(false)}>
          Cart ({cartCount})
        </Link>
        {signedIn && (
          <Link to="/account" onClick={() => setOpen(false)}>
            Account
          </Link>
        )}
        {signedIn ? (
          <button
            className="nav-signout"
            type="button"
            onClick={() => {
              localStorage.removeItem('customerToken')
              localStorage.removeItem('customerProfile')
              setSignedIn(false)
              setOpen(false)
              window.location.assign('/')
            }}
          >
            Sign out
          </button>
        ) : (
          <Link to="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        )}
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '☾ Dark' : '☀ Light'}
        </button>
      </nav>
    </header>
  )
}

export default PublicNav

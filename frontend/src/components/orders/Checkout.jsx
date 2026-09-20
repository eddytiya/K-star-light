import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { readCart, saveCart } from '../../utils/cart'
import catalogueApi from '../catalogue/catalogueApi'
import PublicNav from '../catalogue/PublicNav'
import PriceNotice from '../catalogue/PriceNotice'
import { showError, showSuccess } from '../../utils/toastUtils'
import './orders.css'

const emptyDelivery = {
  name: '',
  companyName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: ''
}
const orderWhatsappNumber = (import.meta.env.VITE_ORDER_WHATSAPP_NUMBER || '919920591596').replace(
  /\D/g,
  ''
)
const orderWhatsappMessage = (order) =>
  `Hello Santosh Pathak, I want these products from K Star Light:\n${order.items.map((item) => `• ${item.productName} × ${item.quantity}`).join('\n')}\n\nOrder request ID: ${order.id}\nWhat are the current prices? Please confirm the final price and delivery details with me before payment.`
const orderWhatsappUrl = (order) =>
  `https://wa.me/${orderWhatsappNumber}?text=${encodeURIComponent(orderWhatsappMessage(order))}`

const Checkout = () => {
  const { slug } = useParams()
  const cartMode = slug === 'cart'
  const [product, setProduct] = useState(null)
  const [cart] = useState(readCart)
  const [quantity, setQuantity] = useState(1)
  const [method, setMethod] = useState('upi')
  const [delivery, setDelivery] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('deliveryAddress') || '{}')
      const profile = JSON.parse(localStorage.getItem('customerProfile') || '{}')
      return { ...emptyDelivery, name: profile.name || '', phone: profile.phone || '', ...saved }
    } catch {
      return emptyDelivery
    }
  })
  const [guestEmail, setGuestEmail] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const token = localStorage.getItem('customerToken')

  useEffect(() => {
    if (!cartMode)
      catalogueApi
        .get(`/${slug}`)
        .then(({ data }) => setProduct(data))
        .catch(() => showError('Product not available'))
  }, [slug, cartMode])
  const items = cartMode
    ? cart
    : product
      ? [{ _id: product._id, name: product.name, price: product.price, quantity: Number(quantity) }]
      : []
  const total =
    Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100
  const cashAllowed = total > 0 && total < 5000

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      const { data } = await apiClient.post(
        '/orders',
        {
          items: items.map((item) => ({ product: item._id, quantity: Number(item.quantity) })),
          delivery,
          paymentMethod: method,
          guestEmail: token ? undefined : guestEmail
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      setResult(data.order)
      localStorage.setItem('deliveryAddress', JSON.stringify(delivery))
      if (data.order.guestAccessToken) {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]')
        localStorage.setItem(
          'guestOrders',
          JSON.stringify([
            ...guestOrders,
            { id: data.order.id, token: data.order.guestAccessToken }
          ])
        )
      }
      if (cartMode) saveCart([])
      showSuccess('Order request saved. Opening WhatsApp…')
      window.location.assign(orderWhatsappUrl(data.order))
    } catch (error) {
      showError(error.response?.data?.message || 'Could not place order')
    } finally {
      setBusy(false)
    }
  }

  if (!cartMode && !product)
    return (
      <>
        <PublicNav />
        <main className="checkout-page">
          <p>Loading checkout…</p>
        </main>
      </>
    )
  if (cartMode && !cart.length)
    return (
      <>
        <PublicNav />
        <main className="checkout-page">
          <p>
            Your cart is empty. <Link to="/">Browse products</Link>
          </p>
        </main>
      </>
    )
  if (result) {
    return (
      <>
        <PublicNav />
        <main className="checkout-page">
          <div className="checkout-success">
            <span>✓</span>
            <h1>Order request received</h1>
            <p>Order ID: {result.id}</p>
            <p>
              {result.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')} · ₹
              {result.total.toLocaleString('en-IN')}
            </p>
            <p>
              We will speak with you to confirm availability, delivery and payment before fulfilling
              this order.
            </p>
            <a className="whatsapp-confirm" href={orderWhatsappUrl(result)}>
              Ask Santosh for prices on WhatsApp
            </a>
            <small className="whatsapp-help">
              WhatsApp opens with your order details. Tap Send to share them with Santosh.
            </small>
            {result.paymentMethod === 'upi' ? (
              <div className="demo-payment">
                <strong>Do not pay yet</strong>
                <p>
                  UPI details will be shared after the owner confirms your order with you. No online
                  payment is collected on this website.
                </p>
              </div>
            ) : (
              <p>Cash preference saved. The owner will confirm your order.</p>
            )}
            {result.emailStatus !== 'sent' && (
              <p className="email-note">
                Email notification could not be confirmed. Keep this order ID for reference.
              </p>
            )}
            <Link to="/my-orders">View my orders</Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <PublicNav />
      <main className="checkout-page">
        <Link to={cartMode ? '/cart' : `/catalogue/${slug}`}>← Back</Link>
        <h1>Checkout</h1>
        <div className="checkout-layout">
          <form onSubmit={submit}>
            {!token && (
              <>
                <h2>Guest checkout</h2>
                <p>
                  No account needed. Save your order link on this device to follow its progress.
                </p>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                  />
                </label>
              </>
            )}
            <h2>Delivery details</h2>
            <div className="checkout-fields">
              {[
                ['name', 'Full name'],
                ['companyName', 'Company name (optional)'],
                ['phone', 'Phone'],
                ['address', 'Street address'],
                ['city', 'City'],
                ['state', 'State'],
                ['postalCode', 'PIN code']
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required={key !== 'companyName'}
                    autoComplete={
                      key === 'postalCode'
                        ? 'postal-code'
                        : key === 'address'
                          ? 'street-address'
                          : key === 'name'
                            ? 'name'
                            : key === 'phone'
                              ? 'tel'
                              : key === 'companyName'
                                ? 'organization'
                                : `address-level${key === 'city' ? '2' : '1'}`
                    }
                    value={delivery[key] || ''}
                    inputMode={key === 'phone' || key === 'postalCode' ? 'numeric' : undefined}
                    pattern={
                      key === 'phone'
                        ? '[6-9][0-9]{9}'
                        : key === 'postalCode'
                          ? '[0-9]{6}'
                          : undefined
                    }
                    onChange={(event) => setDelivery({ ...delivery, [key]: event.target.value })}
                  />
                </label>
              ))}
            </div>
            <h2>Payment preference</h2>
            <label className="payment-option">
              <input type="radio" checked={method === 'upi'} onChange={() => setMethod('upi')} />{' '}
              UPI — details shared after we speak with you
            </label>
            <label className="payment-option">
              <input
                type="radio"
                checked={method === 'cash'}
                disabled={!cashAllowed}
                onChange={() => setMethod('cash')}
              />{' '}
              Cash {cashAllowed ? '' : '(only for totals below ₹5,000)'}
            </label>
            <p className="checkout-warning">
              After your order request is saved, WhatsApp will open with your selected products and
              a message asking Santosh for current prices. Tap Send in WhatsApp to share it. Confirm
              the final price and payment with him before paying.
            </p>
            <button
              disabled={
                busy ||
                items.some((item) => item.quantity < 1 || item.quantity > 100) ||
                (!cartMode && product.stockStatus !== 'In Stock')
              }
            >
              {busy ? 'Saving request…' : 'Continue to WhatsApp'}
            </button>
          </form>
          <aside>
            <h2>Order summary</h2>
            {items.map((item) => (
              <p key={item._id}>
                {item.name} × {item.quantity} · ₹
                {(item.price * item.quantity).toLocaleString('en-IN')}
              </p>
            ))}
            {!cartMode && (
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value)
                    if (product.price * Number(event.target.value) >= 5000) setMethod('upi')
                  }}
                />
              </label>
            )}
            <strong>Product total: ₹{total.toLocaleString('en-IN')}</strong>
            <PriceNotice />
            <small>
              Delivery cost and timing are confirmed separately. Final product total is recalculated
              by the server.
            </small>
          </aside>
        </div>
      </main>
    </>
  )
}

export default Checkout

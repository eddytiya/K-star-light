import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { showError } from '../../utils/toastUtils'
import PublicNav from '../catalogue/PublicNav'
import { readCart } from '../../utils/cart'
import './orders.css'

const stages = ['placed', 'confirmed', 'shipped', 'completed']

const MyOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [profile, setProfile] = useState(null)
  const [cartCount] = useState(() => readCart().reduce((sum, item) => sum + item.quantity, 0))
  useEffect(() => {
    const token = localStorage.getItem('customerToken')
    let guestOrders = []
    try { guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]') } catch { /* Ignore corrupt local data. */ }
    const guestRequests = guestOrders.map(({ id, token: guestToken }) => apiClient.get(`/orders/guest/${id}`, { headers: { 'X-Guest-Token': guestToken } }).then(({ data }) => data).catch(() => null))
    Promise.all([token ? apiClient.get('/orders/mine', { headers: { Authorization: `Bearer ${token}` } }).then(({ data }) => data) : Promise.resolve([]), token ? apiClient.get('/customer-auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(({ data }) => data.customer) : Promise.resolve(null), ...guestRequests])
      .then(([accountOrders, customer, ...guestResults]) => { setProfile(customer); setOrders([...new Map([...accountOrders, ...guestResults.filter(Boolean)].map((order) => [order._id, order])).values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) })
      .catch(() => { setFailed(true); showError('Could not load orders') })
      .finally(() => setLoading(false))
  }, [])
  return <><PublicNav /><main className="checkout-page"><Link to="/">← Catalogue</Link><h1>My orders</h1>{profile && !profile.emailVerified && <p><Link to="/account">Verify your email</Link> to see guest orders placed with this address on other devices.</p>}
    {loading ? <p>Loading orders…</p> : failed ? <p>Orders could not be loaded. Please refresh the page.</p> : orders.length ? orders.map((order) => <article className="order-tile" key={order._id}>
      <div><h2>{order.productName}</h2><p>Qty {order.quantity} · ₹{order.total.toLocaleString('en-IN')}</p><small>Placed {new Date(order.createdAt).toLocaleDateString('en-IN')} · ID {order._id}</small>
        {(order.items?.[0]?.slug || order.product?.slug) && <p><Link to={`/checkout/${order.items?.[0]?.slug || order.product.slug}`}>Buy again</Link></p>}
      </div>
      <div className="order-progress"><strong>{order.status === 'cancelled' ? 'Cancelled' : order.quoteStatus === 'requested' ? 'Awaiting quote' : order.quoteStatus === 'sent' ? 'Quote sent' : stages.includes(order.status) ? order.status[0].toUpperCase() + order.status.slice(1) : order.status}</strong>
        {order.status !== 'cancelled' && <ol className="status-steps">{stages.map((stage, index) => <li className={index <= stages.indexOf(order.status) ? 'done' : ''} key={stage}>{stage === 'placed' ? 'request' : stage}</li>)}</ol>}
        {order.quoteStatus === 'sent' && <p><Link to={`/quote/${order._id}`}>Review and accept Santosh’s quote</Link></p>}
        {order.quoteStatus === 'requested' && <p>Waiting for Santosh to confirm the final price.</p>}
        {order.quoteStatus === 'accepted' && <p>Final quote accepted: ₹{order.quote.total.toLocaleString('en-IN')}</p>}
        <p>{order.paymentMethod.toUpperCase()} · {order.quoteStatus !== 'accepted' && !order.stockReserved ? 'Do not pay before accepting the quote' : order.paymentStatus === 'pending' ? 'Awaiting payment verification' : order.paymentStatus === 'verified' ? 'Payment verified' : 'Payment on delivery'}</p>
        {order.status === 'shipped' && !order.trackingNumber && <small>Contact us for delivery updates.</small>}
        {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
      </div>
    </article>) : <div className="orders-empty"><h2>No orders placed yet</h2><p>{cartCount ? `You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart. Finish checkout to place your order.` : 'When you place an order, its progress will appear here.'}</p><Link className="hero-button" to={cartCount ? '/cart' : '/'}>{cartCount ? 'Go to cart' : 'Explore products'}</Link></div>}
  </main></>
}

export default MyOrders

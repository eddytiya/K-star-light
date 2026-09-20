import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNav from '../catalogue/PublicNav'
import PriceNotice from '../catalogue/PriceNotice'
import { readCart, saveCart } from '../../utils/cart'
import './orders.css'

const Cart = () => {
  const [items, setItems] = useState(readCart)
  const update = (id, quantity) => { const next = items.map((item) => item._id === id ? { ...item, quantity: Math.max(1, Math.min(100, Number(quantity) || 1)) } : item); setItems(next); saveCart(next) }
  const remove = (id) => { const next = items.filter((item) => item._id !== id); setItems(next); saveCart(next) }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return <><PublicNav /><main className="checkout-page"><Link to="/">← Continue shopping</Link><h1>Your cart</h1>{items.length ? <><div className="cart-list">{items.map((item) => <article className="cart-row" key={item._id}>{item.image && <img src={item.image} alt="" />}<div><Link to={`/catalogue/${item.slug}`}>{item.name}</Link><p>₹{item.price.toLocaleString('en-IN')} each</p></div><label>Qty<input type="number" min="1" max="100" value={item.quantity} onChange={(event) => update(item._id, event.target.value)} /></label><button type="button" onClick={() => remove(item._id)}>Remove</button></article>)}</div><div className="cart-summary"><strong>Product total: ₹{total.toLocaleString('en-IN')}</strong><PriceNotice /><p>Delivery cost and timing will be confirmed before fulfilment.</p><Link className="hero-button" to="/checkout/cart">Continue to checkout</Link></div></> : <p>Your cart is empty. <Link to="/">Browse lights</Link></p>}</main></>
}

export default Cart

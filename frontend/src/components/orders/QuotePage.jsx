import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { showError, showSuccess } from '../../utils/toastUtils'
import PublicNav from '../catalogue/PublicNav'
import './orders.css'

const QuotePage = () => {
  const { id } = useParams()
  const [params] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const token = params.get('token')
  let guestToken = ''
  try {
    guestToken =
      JSON.parse(localStorage.getItem('guestOrders') || '[]').find((item) => item.id === id)
        ?.token || ''
  } catch {
    /* Ignore corrupt local data. */
  }
  const headers = token
    ? { Authorization: 'Quote', 'X-Quote-Token': token }
    : guestToken
      ? { Authorization: 'Quote', 'X-Guest-Token': guestToken }
      : localStorage.getItem('customerToken')
        ? { Authorization: `Bearer ${localStorage.getItem('customerToken')}` }
        : { Authorization: 'Quote' }
  useEffect(() => {
    apiClient
      .get(`/orders/${id}/quote`, { headers })
      .then(({ data }) => setOrder(data))
      .catch(() => setFailed(true))
  }, [id, token]) // eslint-disable-line react-hooks/exhaustive-deps
  const accept = async () => {
    setBusy(true)
    try {
      const { data } = await apiClient.post(`/orders/${id}/quote/accept`, {}, { headers })
      setOrder(data)
      showSuccess('Quote accepted. Your order is confirmed.')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not accept quote')
    } finally {
      setBusy(false)
    }
  }
  if (failed)
    return (
      <>
        <PublicNav />
        <main className="checkout-page">
          <h1>Quote unavailable</h1>
          <p>Check the link, or sign in with the email used for this order.</p>
        </main>
      </>
    )
  if (!order)
    return (
      <>
        <PublicNav />
        <main className="checkout-page">
          <p>Loading quote…</p>
        </main>
      </>
    )
  const quote = order.quote
  const expired = quote?.validUntil && new Date(quote.validUntil) < new Date()
  return (
    <>
      <div className="quote-no-print">
        <PublicNav />
      </div>
      <main className="checkout-page quote-document">
        <div className="quote-paper">
          <span className="eyebrow">K STAR LIGHT</span>
          <h1>Quotation</h1>
          <p>Prepared for {order.customerName}</p>
          <p>Order request: {order.id}</p>
          <p>
            Issued: {quote?.sentAt ? new Date(quote.sentAt).toLocaleDateString('en-IN') : '—'} ·
            Valid until:{' '}
            {quote?.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-IN') : '—'}
          </p>
          {quote?.items?.length ? (
            <>
              <div className="quote-table">
                <div>
                  <strong>Product</strong>
                  <strong>Qty</strong>
                  <strong>Unit price</strong>
                  <strong>Amount</strong>
                </div>
                {quote.items.map((item, index) => (
                  <div key={index}>
                    <span>{item.productName}</span>
                    <span>{item.quantity}</span>
                    <span>₹{item.unitPrice.toLocaleString('en-IN')}</span>
                    <span>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <p>Delivery charge: ₹{quote.deliveryCharge.toLocaleString('en-IN')}</p>
              <h2>Total: ₹{quote.total.toLocaleString('en-IN')}</h2>
              {quote.notes && <p className="quote-notes">{quote.notes}</p>}
              <p>
                Payment and delivery are arranged after the quote is accepted. Please contact
                Santosh if you need changes.
              </p>
            </>
          ) : (
            <p>Santosh has not sent a quote yet.</p>
          )}
          <div className="quote-no-print quote-actions-bottom">
            <button type="button" onClick={() => window.print()}>
              Save quote as PDF
            </button>
            {order.quoteStatus === 'sent' && !expired && (
              <button type="button" onClick={accept} disabled={busy}>
                {busy ? 'Confirming…' : 'Accept quote and confirm order'}
              </button>
            )}
            {expired && <p>This quote has expired. Please ask Santosh for an updated price.</p>}
            {order.quoteStatus === 'accepted' && <p>Quote accepted. Your order is confirmed.</p>}
            <Link to="/my-orders">My orders</Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default QuotePage

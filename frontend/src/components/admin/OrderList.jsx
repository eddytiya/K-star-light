import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'
import { showError, showSuccess } from '../../utils/toastUtils'
import useAdminData from './useAdminData'
import AdminLoadState from './AdminLoadState'
import { downloadCsv } from '../../utils/adminExports'
import { orderMessageLink } from '../../utils/whatsappTemplates'

const statuses = ['placed', 'confirmed', 'shipped', 'completed', 'cancelled']
const tomorrow = () => {
  const day = new Date()
  day.setDate(day.getDate() + 1)
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
}

const OrderList = () => {
  const [searchParams] = useSearchParams()
  const { data: orders, setData: setOrders, loading, error, retry } = useAdminData('/orders', [])
  const [query, setQuery] = useState(() => searchParams.get('search') || '')
  const [filter, setFilter] = useState('')
  const [tracking, setTracking] = useState({})
  const [trackingUrls, setTrackingUrls] = useState({})
  const [drafts, setDrafts] = useState({})
  const [shareLinks, setShareLinks] = useState({})
  const update = async (id, patch) => {
    try {
      const { data } = await apiClient.patch(`/orders/${id}`, patch)
      setOrders((items) => items.map((item) => (item._id === id ? { ...item, ...data } : item)))
      showSuccess('Order updated')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not update order')
    }
  }
  const draftFor = (order) =>
    drafts[order._id] || {
      prices: order.items.map(
        (item, index) => order.quote?.items?.[index]?.unitPrice ?? item.unitPrice
      ),
      deliveryCharge: order.quote?.deliveryCharge ?? 0,
      validUntil: order.quote?.validUntil?.slice(0, 10) || tomorrow(),
      notes: order.quote?.notes || ''
    }
  const changeDraft = (order, patch) =>
    setDrafts((current) => ({ ...current, [order._id]: { ...draftFor(order), ...patch } }))
  const sendQuote = async (order) => {
    try {
      const { data } = await apiClient.post(`/orders/${order._id}/quote`, draftFor(order))
      setOrders((current) => current.map((item) => (item._id === order._id ? data.order : item)))
      setShareLinks((current) => ({ ...current, [order._id]: data.shareUrl }))
      showSuccess(
        data.emailSent
          ? 'Quote emailed and ready to share'
          : 'Quote saved. Share the link with the customer.'
      )
    } catch (error) {
      showError(error.response?.data?.message || 'Could not send quote')
    }
  }
  const visible = orders.filter(
    (order) =>
      (!filter || order.status === filter) &&
      `${order.productName} ${order.customer?.name || ''} ${order.delivery.phone} ${order._id}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const needsAction = orders.filter((order) => order.status === 'placed').length
  const exportOrders = () =>
    downloadCsv(
      'k-star-light-orders.csv',
      [
        'Order ID',
        'Date',
        'Customer',
        'Company',
        'Email',
        'Phone',
        'Products',
        'Quantity',
        'Request total INR',
        'Agreed total INR',
        'Quote status',
        'Order status',
        'Payment',
        'Courier tracking number',
        'Courier tracking URL'
      ],
      visible.map((order) => [
        order._id,
        order.createdAt,
        order.delivery.name,
        order.delivery.companyName,
        order.customer?.email || order.guestEmail,
        order.delivery.phone,
        order.items?.map((item) => item.productName + ' x ' + item.quantity).join('; ') ||
          order.productName,
        order.quantity,
        order.total,
        order.quote?.total,
        order.quoteStatus,
        order.status,
        order.paymentStatus,
        order.trackingNumber,
        order.trackingUrl
      ])
    )
  return (
    <main className="product-page">
      <header className="product-header">
        <div>
          <span className="eyebrow">K STAR LIGHT</span>
          <h1>Orders</h1>
          <p>
            {needsAction} request{needsAction === 1 ? '' : 's'} awaiting a quote or customer
            response.
          </p>
        </div>
      </header>
      <AdminLoadState
        loading={loading}
        error={error}
        onRetry={retry}
        empty={orders.length === 0}
        emptyTitle="No website requests yet"
        emptyMessage="New checkout requests will appear here. You can record phone and WhatsApp orders manually."
        actionTo="/admin/manual-orders"
        actionLabel="Add manual order"
      >
        <div className="order-admin-tools">
          <button
            type="button"
            className="admin-export-button"
            onClick={exportOrders}
            disabled={!visible.length}
          >
            Export {visible.length} orders CSV
          </button>
          <input
            aria-label="Search orders"
            placeholder="Search customer, product, phone or order ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="Filter orders"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="enquiry-grid">
          {visible.map((order) => (
            <article className="enquiry-card" key={order._id}>
              <div className="enquiry-card-head">
                <div>
                  <span>
                    {order.status} · quote {order.quoteStatus || 'legacy'}
                  </span>
                  <h2>{order.productName}</h2>
                  <p>
                    {order.customer?.name || order.delivery.name} ·{' '}
                    {order.customer?.email || order.guestEmail}
                  </p>
                </div>
                <strong>₹{order.total.toLocaleString('en-IN')}</strong>
              </div>
              <p>
                Qty {order.quantity} · {order.paymentMethod.toUpperCase()} · Payment{' '}
                {order.paymentStatus}
              </p>
              <p>
                {order.delivery.name}
                {order.delivery.companyName ? `, ${order.delivery.companyName}` : ''},{' '}
                {order.delivery.address}, {order.delivery.city}, {order.delivery.state}{' '}
                {order.delivery.postalCode}
              </p>
              <p>
                Phone: <a href={`tel:+91${order.delivery.phone}`}>{order.delivery.phone}</a>
              </p>
              <small>Order ID: {order._id}</small>
              <div className="enquiry-actions">
                <div className="admin-message-actions">
                  <a href={orderMessageLink(order, 'received')} target="_blank" rel="noreferrer">
                    Request received
                  </a>
                  {order.quoteStatus === 'sent' && order.quote?.total != null && (
                    <a
                      href={orderMessageLink(order, 'quote', shareLinks[order._id])}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Share quote
                    </a>
                  )}
                  <a href={orderMessageLink(order, 'followup')} target="_blank" rel="noreferrer">
                    Follow up
                  </a>
                </div>
                <button type="button" onClick={() => update(order._id, { contacted: true })}>
                  {order.contactedAt ? 'Contacted ✓' : 'Mark contacted'}
                </button>
                <select
                  aria-label={`Status for ${order.productName}`}
                  value={order.status}
                  onChange={(event) => update(order._id, { status: event.target.value })}
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                      disabled={
                        order.stockReserved === false && !['placed', 'cancelled'].includes(status)
                      }
                    >
                      {status}
                    </option>
                  ))}
                </select>
                {order.paymentMethod === 'upi' && (
                  <button
                    type="button"
                    onClick={() => update(order._id, { paymentStatus: 'verified' })}
                    disabled={order.paymentStatus === 'verified'}
                  >
                    Verify UPI
                  </button>
                )}
              </div>
              <label className="follow-up-label">
                Follow up on
                <input
                  type="date"
                  value={order.followUpAt?.slice(0, 10) || ''}
                  onChange={(event) => update(order._id, { followUpAt: event.target.value })}
                />
              </label>
              {order.status === 'placed' && order.stockReserved === false && (
                <div className="admin-quote-editor">
                  <h3>Prepare final quote</h3>
                  {order.items.map((item, index) => (
                    <label key={index}>
                      {item.productName} × {item.quantity} — unit price (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftFor(order).prices[index]}
                        onChange={(event) => {
                          const prices = [...draftFor(order).prices]
                          prices[index] = event.target.value
                          changeDraft(order, { prices })
                        }}
                      />
                    </label>
                  ))}
                  <label>
                    Delivery charge (₹)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftFor(order).deliveryCharge}
                      onChange={(event) =>
                        changeDraft(order, { deliveryCharge: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Valid until
                    <input
                      type="date"
                      min={tomorrow()}
                      value={draftFor(order).validUntil}
                      onChange={(event) => changeDraft(order, { validUntil: event.target.value })}
                    />
                  </label>
                  <label>
                    Terms / notes
                    <textarea
                      maxLength={1000}
                      value={draftFor(order).notes}
                      onChange={(event) => changeDraft(order, { notes: event.target.value })}
                    />
                  </label>
                  <button type="button" onClick={() => sendQuote(order)}>
                    Save and send quote
                  </button>
                  {shareLinks[order._id] && (
                    <div className="quote-share-actions">
                      <a href={shareLinks[order._id]} target="_blank" rel="noreferrer">
                        Open quote / save PDF
                      </a>
                      <a
                        href={`https://wa.me/91${order.delivery.phone}?text=${encodeURIComponent(`Hello ${order.delivery.name}, here is your K Star Light quotation: ${shareLinks[order._id]}`)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Share on WhatsApp
                      </a>
                    </div>
                  )}
                  {order.quoteStatus === 'sent' && (
                    <p>Quote sent. Waiting for the customer to accept it.</p>
                  )}
                </div>
              )}
              <div className="tracking-editor">
                <input
                  aria-label={`Tracking number for ${order.productName}`}
                  placeholder="Courier tracking number"
                  value={tracking[order._id] ?? order.trackingNumber ?? ''}
                  onChange={(event) =>
                    setTracking({ ...tracking, [order._id]: event.target.value })
                  }
                />
                <input
                  type="url"
                  aria-label={'Courier tracking URL for ' + order.productName}
                  placeholder="Courier tracking link (https://…)"
                  value={trackingUrls[order._id] ?? order.trackingUrl ?? ''}
                  onChange={(event) =>
                    setTrackingUrls({ ...trackingUrls, [order._id]: event.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    update(order._id, {
                      trackingNumber: tracking[order._id] ?? order.trackingNumber ?? '',
                      trackingUrl: trackingUrls[order._id] ?? order.trackingUrl ?? ''
                    })
                  }
                >
                  Save tracking
                </button>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="state-card">No matching orders. Try another search or status.</div>
        )}
      </AdminLoadState>
    </main>
  )
}

export default OrderList

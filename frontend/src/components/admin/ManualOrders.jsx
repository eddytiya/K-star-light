import { useState } from 'react'
import { apiClient } from '../../utils/apiClient'
import { showError, showSuccess } from '../../utils/toastUtils'
import useAdminData from './useAdminData'
import AdminLoadState from './AdminLoadState'
import { downloadCsv } from '../../utils/adminExports'

const statuses = ['placed', 'confirmed', 'shipped', 'completed', 'cancelled']
const blank = () => ({
  customerName: '',
  companyName: '',
  phone: '',
  email: '',
  items: [{ description: '', quantity: 1, unitPrice: '' }],
  agreedTotal: '',
  notes: '',
  status: 'placed',
  orderDate: new Date().toISOString().slice(0, 10)
})
const money = (value) => `₹${Number(value).toLocaleString('en-IN')}`

const ManualOrders = () => {
  const {
    data: orders,
    setData: setOrders,
    loading,
    error,
    retry
  } = useAdminData('/manual-orders', [])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const changeItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    }))
  const edit = (order) => {
    setEditingId(order._id)
    setForm({
      customerName: order.customerName || '',
      companyName: order.companyName || '',
      phone: order.phone || '',
      email: order.email || '',
      items: order.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? ''
      })),
      agreedTotal: order.agreedTotal ?? '',
      notes: order.notes || '',
      status: order.status,
      orderDate: new Date(order.orderDate).toISOString().slice(0, 10)
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const reset = () => {
    setEditingId(null)
    setForm(blank())
  }
  const remove = async (order) => {
    if (
      !window.confirm(
        `Delete the manual order for ${order.companyName || order.customerName}? This cannot be undone.`
      )
    )
      return
    try {
      await apiClient.delete(`/manual-orders/${order._id}`)
      setOrders((current) => current.filter((item) => item._id !== order._id))
      if (editingId === order._id) reset()
      showSuccess('Manual order deleted')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not delete manual order')
    }
  }
  const submit = async (event) => {
    event.preventDefault()
    if (!form.customerName.trim() && !form.companyName.trim())
      return showError('Enter a customer or company name')
    if (
      form.items.some(
        (item) =>
          !item.description.trim() ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1
      )
    )
      return showError('Enter an item description and valid quantity')
    setBusy(true)
    try {
      const payload = {
        ...form,
        items: form.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: item.unitPrice === '' ? undefined : Number(item.unitPrice)
        })),
        agreedTotal: form.agreedTotal === '' ? null : Number(form.agreedTotal)
      }
      const { data } = editingId
        ? await apiClient.patch(`/manual-orders/${editingId}`, payload)
        : await apiClient.post('/manual-orders', payload)
      setOrders((current) =>
        editingId
          ? current.map((order) => (order._id === editingId ? data : order))
          : [data, ...current]
      )
      showSuccess(editingId ? 'Manual order updated' : 'Manual order saved')
      reset()
    } catch (error) {
      showError(error.response?.data?.message || 'Could not save manual order')
    } finally {
      setBusy(false)
    }
  }
  const visible = orders.filter((order) =>
    `${order.customerName || ''} ${order.companyName || ''} ${order.phone || ''} ${order.items.map((item) => item.description).join(' ')} ${order._id}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )
  const exportManualOrders = () =>
    downloadCsv(
      'k-star-light-manual-orders.csv',
      [
        'Order ID',
        'Date',
        'Customer',
        'Company',
        'Phone',
        'Email',
        'Items',
        'Agreed total INR',
        'Status',
        'Notes'
      ],
      visible.map((order) => [
        order._id,
        order.orderDate,
        order.customerName,
        order.companyName,
        order.phone,
        order.email,
        order.items.map((item) => item.description + ' x ' + item.quantity).join('; '),
        order.agreedTotal,
        order.status,
        order.notes
      ])
    )

  return (
    <main className="product-page manual-page">
      <header className="product-header">
        <div>
          <span className="eyebrow">K STAR LIGHT</span>
          <h1>Manual orders</h1>
          <p>
            Record orders taken by phone, WhatsApp or in person. These records do not reserve
            website stock or send automated emails.
          </p>
        </div>
      </header>
      <form className="manual-form" onSubmit={submit}>
        <div className="manual-form-head">
          <h2>{editingId ? 'Edit manual order' : 'Add manual order'}</h2>
          {editingId && (
            <button type="button" onClick={reset}>
              Cancel edit
            </button>
          )}
        </div>
        <div className="manual-fields">
          <label>
            Customer name
            <input
              value={form.customerName}
              maxLength={100}
              onChange={(e) => change('customerName', e.target.value)}
              placeholder="Person's name"
            />
          </label>
          <label>
            Company name
            <input
              value={form.companyName}
              maxLength={150}
              onChange={(e) => change('companyName', e.target.value)}
              placeholder="Company, if applicable"
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={form.phone}
              maxLength={30}
              onChange={(e) => change('phone', e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              maxLength={254}
              onChange={(e) => change('email', e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Order date
            <input
              type="date"
              required
              value={form.orderDate}
              onChange={(e) => change('orderDate', e.target.value)}
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => change('status', e.target.value)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <h3>Items ordered</h3>
        {form.items.map((item, index) => (
          <div className="manual-item" key={index}>
            <label>
              Description
              <input
                required
                maxLength={200}
                value={item.description}
                onChange={(e) => changeItem(index, 'description', e.target.value)}
                placeholder="Product or custom item"
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                required
                min="1"
                max="10000"
                step="1"
                value={item.quantity}
                onChange={(e) => changeItem(index, 'quantity', e.target.value)}
              />
            </label>
            <label>
              Unit price (optional)
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => changeItem(index, 'unitPrice', e.target.value)}
                placeholder="₹"
              />
            </label>
            {form.items.length > 1 && (
              <button
                type="button"
                aria-label={`Remove item ${index + 1}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: current.items.filter((_, i) => i !== index)
                  }))
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          className="manual-secondary"
          type="button"
          disabled={form.items.length >= 30}
          onClick={() =>
            setForm((current) => ({
              ...current,
              items: [...current.items, { description: '', quantity: 1, unitPrice: '' }]
            }))
          }
        >
          + Add item
        </button>
        <div className="manual-fields manual-bottom">
          <label>
            Agreed total (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.agreedTotal}
              onChange={(e) => change('agreedTotal', e.target.value)}
              placeholder="Leave blank if not agreed"
            />
          </label>
          <label>
            Notes
            <textarea
              maxLength={2000}
              value={form.notes}
              onChange={(e) => change('notes', e.target.value)}
              placeholder="Delivery, payment or follow-up details"
            />
          </label>
        </div>
        <button className="manual-submit" type="submit" disabled={busy}>
          {busy ? 'Saving…' : editingId ? 'Save changes' : 'Save manual order'}
        </button>
      </form>
      <section className="manual-list">
        <div className="manual-list-head">
          <h2>Saved manual orders ({orders.length})</h2>
          <button
            type="button"
            className="admin-export-button"
            disabled={!visible.length}
            onClick={exportManualOrders}
          >
            Export {visible.length} CSV
          </button>
          <input
            aria-label="Search manual orders"
            placeholder="Search name, company, item or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AdminLoadState
          loading={loading}
          error={error}
          onRetry={retry}
          empty={orders.length === 0}
          emptyTitle="No manual orders yet"
          emptyMessage="Use the form above to record an order taken by phone, WhatsApp or in person."
        >
          <div className="enquiry-grid">
            {visible.map((order) => (
              <article className="enquiry-card" key={order._id}>
                <div className="enquiry-card-head">
                  <div>
                    <span>
                      {order.status} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
                    </span>
                    <h2>{order.companyName || order.customerName}</h2>
                    {order.companyName && order.customerName && (
                      <p>Contact: {order.customerName}</p>
                    )}
                  </div>
                  {order.agreedTotal != null && <strong>{money(order.agreedTotal)}</strong>}
                </div>
                <ul>
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.description} × {item.quantity}
                      {item.unitPrice != null ? ` · ${money(item.unitPrice)} each` : ''}
                    </li>
                  ))}
                </ul>
                {order.phone && (
                  <p>
                    Phone: <a href={`tel:${order.phone}`}>{order.phone}</a>
                  </p>
                )}
                {order.email && (
                  <p>
                    Email: <a href={`mailto:${order.email}`}>{order.email}</a>
                  </p>
                )}
                {order.notes && <p className="manual-notes">{order.notes}</p>}
                <div className="enquiry-actions manual-card-actions">
                  <button type="button" onClick={() => edit(order)}>
                    Edit order
                  </button>
                  <button type="button" onClick={() => remove(order)}>
                    Delete
                  </button>
                </div>
                <small>ID: {order._id}</small>
              </article>
            ))}
          </div>
          {!visible.length && (
            <div className="state-card">No matching manual orders. Try another search.</div>
          )}
        </AdminLoadState>
      </section>
    </main>
  )
}

export default ManualOrders

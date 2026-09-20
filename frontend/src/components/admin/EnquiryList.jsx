import { useState } from 'react'
import { showError, showSuccess } from '../../utils/toastUtils'
import { apiClient } from '../../utils/apiClient'
import useAdminData from './useAdminData'
import AdminLoadState from './AdminLoadState'

const statuses = ['New', 'Contacted', 'Quoted', 'Closed']

const EnquiryList = () => {
  const [filter, setFilter] = useState('')
  const [drafts, setDrafts] = useState({})
  const {
    data: enquiries,
    setData: setEnquiries,
    loading,
    error,
    retry
  } = useAdminData(`/enquiries${filter ? `?status=${encodeURIComponent(filter)}` : ''}`, [])
  const update = async (id, patch) => {
    try {
      await apiClient.put(`/enquiries/${id}`, patch)
      setEnquiries((items) =>
        items.map((item) =>
          item._id === id
            ? {
                ...item,
                ...patch,
                quotedTotal:
                  patch.quotedTotal !== undefined ? Number(patch.quotedTotal) : item.quotedTotal
              }
            : item
        )
      )
      showSuccess('Enquiry updated')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not update enquiry')
    }
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return
    try {
      await apiClient.delete(`/enquiries/${id}`)
      setEnquiries((items) => items.filter((item) => item._id !== id))
      showSuccess('Enquiry deleted')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not delete enquiry')
    }
  }
  const quoteMessage = (enquiry) =>
    `Hello ${enquiry.customerName}, here is your quotation for ${enquiry.product?.name || 'your lighting request'} (quantity ${enquiry.quantity}): ₹${enquiry.quotedTotal?.toLocaleString('en-IN')}. ${enquiry.quoteNote || ''} Please reply if you would like to proceed.`
  return (
    <main className="product-page">
      <header className="product-header">
        <div>
          <span className="eyebrow">CUSTOMER REQUESTS</span>
          <h1>Quotation enquiries</h1>
          <p>Contact customers and track every request.</p>
        </div>
        <select
          className="admin-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </header>
      <AdminLoadState
        loading={loading}
        error={error}
        onRetry={retry}
        empty={enquiries.length === 0}
        emptyTitle={filter ? `No ${filter.toLowerCase()} enquiries` : 'No enquiries yet'}
        emptyMessage={
          filter
            ? 'Choose another status to see more requests.'
            : 'Product quotation requests will appear here.'
        }
      >
        <div className="enquiry-grid">
          {enquiries.map((enquiry) => (
            <article className="enquiry-card" key={enquiry._id}>
              <div className="enquiry-card-head">
                <div>
                  <span>{enquiry.status}</span>
                  <h2>{enquiry.customerName}</h2>
                  <p>{enquiry.product?.name || 'Deleted product'}</p>
                </div>
                <strong>Qty {enquiry.quantity}</strong>
              </div>
              <dl>
                <div>
                  <dt>Phone</dt>
                  <dd>{enquiry.phone}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{enquiry.city}</dd>
                </div>
                <div>
                  <dt>Message</dt>
                  <dd>{enquiry.message || '—'}</dd>
                </div>
              </dl>
              <div className="quote-editor">
                <label>
                  Total quote (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={drafts[enquiry._id]?.quotedTotal ?? enquiry.quotedTotal ?? ''}
                    onChange={(event) =>
                      setDrafts({
                        ...drafts,
                        [enquiry._id]: { ...drafts[enquiry._id], quotedTotal: event.target.value }
                      })
                    }
                  />
                </label>
                <label>
                  Quote note
                  <input
                    maxLength="300"
                    value={drafts[enquiry._id]?.quoteNote ?? enquiry.quoteNote ?? ''}
                    onChange={(event) =>
                      setDrafts({
                        ...drafts,
                        [enquiry._id]: { ...drafts[enquiry._id], quoteNote: event.target.value }
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={(drafts[enquiry._id]?.quotedTotal ?? enquiry.quotedTotal ?? '') === ''}
                  onClick={() => update(enquiry._id, { ...drafts[enquiry._id], status: 'Quoted' })}
                >
                  Save quote
                </button>
                {enquiry.quotedTotal !== undefined && (
                  <a
                    href={`https://wa.me/91${enquiry.phone}?text=${encodeURIComponent(quoteMessage(enquiry))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Send quote on WhatsApp
                  </a>
                )}
              </div>
              <div className="enquiry-actions">
                <a
                  href={`https://wa.me/91${enquiry.phone}?text=${encodeURIComponent(`Hello ${enquiry.customerName}, this is Santosh from K Star Light regarding your ${enquiry.product?.name || 'product'} quotation.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <select
                  value={enquiry.status}
                  onChange={(event) => update(enquiry._id, { status: event.target.value })}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <button type="button" onClick={() => remove(enquiry._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </AdminLoadState>
    </main>
  )
}

export default EnquiryList

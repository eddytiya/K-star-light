import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../utils/apiClient'

const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'
const formatMoney = (value, quoteStatus) => value == null ? 'Price to confirm' : `${quoteStatus === 'requested' || quoteStatus === 'sent' ? 'Indicative ' : ''}₹${Number(value).toLocaleString('en-IN')}`

const CustomerRecords = () => {
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async (signal) => {
    await Promise.resolve()
    if (signal?.aborted) return
    setStatus('loading')
    setErrorMessage('')
    try {
      const { data } = await apiClient.get('/customer-records', { signal })
      if (!Array.isArray(data)) throw new Error('Unexpected customer data from the server')
      setRecords(data)
      setStatus('ready')
    } catch (error) {
      if (error.code === 'ERR_CANCELED') return
      setErrorMessage(error.response?.status === 404 ? 'The customer records API is unavailable. Restart the backend server to load this page.' : error.response?.data?.message || error.message || 'Could not load customer records.')
      setStatus('error')
    }
  }, [])

  useEffect(() => { const controller = new AbortController(); Promise.resolve().then(() => load(controller.signal)); return () => controller.abort() }, [load])
  const visible = records.filter((record) => `${record.name || ''} ${record.companyName || ''} ${record.phone || ''} ${record.email || ''} ${(record.orders || []).flatMap((order) => order.items || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  const orderCount = records.reduce((sum, record) => sum + (record.orders?.length || 0), 0)

  return <main className="product-page customer-records-page">
    <header className="product-header"><div><span className="eyebrow">CUSTOMER DIRECTORY</span><h1>Customers & companies</h1><p>Find people and businesses across website and manual orders.</p></div><Link className="primary-button" to="/admin/manual-orders">Add manual order</Link></header>
    {status === 'loading' && <div className="state-card" role="status">Loading customer records…</div>}
    {status === 'error' && <div className="state-card admin-error-state" role="alert"><h2>Customer records could not load</h2><p>{errorMessage}</p><button className="primary-button" type="button" onClick={() => load()}>Try again</button></div>}
    {status === 'ready' && <>
      <div className="customer-summary"><div><strong>{records.length}</strong><span>Customers & companies</span></div><div><strong>{orderCount}</strong><span>Orders recorded</span></div><p>Records are grouped by matching email, phone, or company. Check details before contacting a customer.</p></div>
      <div className="customer-toolbar"><label htmlFor="customer-search">Search records</label><input id="customer-search" type="search" placeholder="Name, company, email, phone or product" value={query} onChange={(event) => setQuery(event.target.value)} /><span>{visible.length} result{visible.length === 1 ? '' : 's'}</span></div>
      {visible.length ? <div className="customer-record-grid">{visible.map((record) => <article className="customer-record-card" key={record.key}>
        <div className="customer-record-head"><div className="customer-avatar" aria-hidden="true">{(record.companyName || record.name || '?').trim().charAt(0).toUpperCase()}</div><div><span className="customer-type">{record.companyName ? 'Company' : 'Customer'}</span><h2>{record.companyName || record.name || 'Unnamed customer'}</h2>{record.companyName && record.name && <p>Contact: {record.name}</p>}</div><span className="customer-order-count">{record.orders?.length || 0} order{record.orders?.length === 1 ? '' : 's'}</span></div>
        <div className="customer-contact">{record.phone && <a href={`tel:${record.phone}`}>Call {record.phone}</a>}{record.email && <a href={`mailto:${record.email}`}>Email {record.email}</a>}{!record.phone && !record.email && <span>No contact details saved</span>}</div>
        <div className="customer-history"><h3>Order history</h3>{(record.orders || []).map((order) => <div className="customer-order" key={order.id}><div><span>{formatDate(order.date)} · {order.source === 'manual' ? 'Manual order' : 'Website request'}</span><strong>{(order.items || []).join(', ') || 'Order items unavailable'}</strong><small>#{String(order.id).slice(-8)} · {order.status}</small></div><b>{formatMoney(order.total, order.quoteStatus)}</b></div>)}</div>
      </article>)}</div> : <div className="state-card"><h2>{query ? 'No matching records' : 'No customers yet'}</h2><p>{query ? 'Try a different name, company, phone, email or product.' : 'Customers appear here after website or manual orders are saved.'}</p>{query ? <button className="secondary-button" type="button" onClick={() => setQuery('')}>Clear search</button> : <Link className="primary-button" to="/admin/manual-orders">Add a manual order</Link>}</div>}
    </>}
  </main>
}

export default CustomerRecords

import { Link } from 'react-router-dom'
import useAdminData from './useAdminData'
import AdminLoadState from './AdminLoadState'

const AdminDashboard = () => {
  const { data, loading, error, retry } = useAdminData('/dashboard', null)
  if (loading || error || !data) return <main className="product-page"><AdminLoadState loading={loading} error={error} onRetry={retry} empty={!data} emptyTitle="Dashboard unavailable" emptyMessage="Refresh to see current activity." /></main>
  const cards = [['New requests', data.pendingRequests], ['Quotes awaiting reply', data.quotesAwaitingReply], ['Confirmed to arrange', data.confirmedOrders], ['Manual orders', data.manualOrders], ['Out of stock', data.outOfStock], ['New enquiries', data.newEnquiries]]
  return <main className="product-page"><header className="product-header"><div><span className="eyebrow">ADMIN OVERVIEW</span><h1>Dashboard</h1><p>Requests, quotes, stock and follow-ups in one place.</p></div><Link className="primary-button" to="/admin/products/new">Add product</Link></header><section className="stats-grid">{cards.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value ?? 0}</strong></article>)}</section><div className="dashboard-columns"><section className="dashboard-panel"><div className="admin-panel-heading"><h2>Follow up</h2><Link to="/admin/orders">All orders →</Link></div>{data.dueFollowUps?.length ? data.dueFollowUps.map((order) => <div className="dashboard-row" key={order._id}><span>{order.delivery?.name || 'Customer'}<small>{order.productName} · {order.status === 'confirmed' ? 'Arrange delivery' : order.quoteStatus === 'sent' ? 'Quote awaiting reply' : 'Contact customer'}</small></span><Link to={`/admin/orders?search=${order._id}`}>Open</Link></div>) : <p>No follow-ups due.</p>}</section><section className="dashboard-panel"><div className="admin-panel-heading"><h2>Low stock</h2><Link to="/admin/products">Inventory →</Link></div>{data.lowStock?.length ? data.lowStock.map((product) => <div className="dashboard-row" key={product._id}><span>{product.name}</span><strong>{product.stockQuantity} left</strong></div>) : <p>No low-stock products.</p>}</section></div><div className="admin-quick-links"><Link to="/admin/manual-orders">Record a manual order →</Link><Link to="/admin/customers">View customer directory →</Link><Link to="/admin/enquiries">Review enquiries →</Link></div></main>
}

export default AdminDashboard



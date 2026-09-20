import { Link } from 'react-router-dom'
import useAdminData from './useAdminData'
import AdminLoadState from './AdminLoadState'
import { downloadCsv } from '../../utils/adminExports'

const AdminDashboard = () => {
  const { data, loading, error, retry } = useAdminData('/dashboard', null)
  const {
    data: productEnquiries,
    loading: reportLoading,
    error: reportError,
    retry: retryReport
  } = useAdminData('/reports/product-enquiries', [])
  if (loading || error || !data)
    return (
      <main className="product-page">
        <AdminLoadState
          loading={loading}
          error={error}
          onRetry={retry}
          empty={!data}
          emptyTitle="Dashboard unavailable"
          emptyMessage="Refresh to see current activity."
        />
      </main>
    )
  const cards = [
    ['New requests', data.pendingRequests],
    ['Quotes awaiting reply', data.quotesAwaitingReply],
    ['Confirmed to arrange', data.confirmedOrders],
    ['Manual orders', data.manualOrders],
    ['Out of stock', data.outOfStock],
    ['New enquiries', data.newEnquiries]
  ]
  return (
    <main className="product-page">
      <header className="product-header">
        <div>
          <span className="eyebrow">ADMIN OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>Requests, quotes, stock and follow-ups in one place.</p>
        </div>
        <Link className="primary-button" to="/admin/products/new">
          Add product
        </Link>
      </header>
      <section className="stats-grid">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </article>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="admin-panel-heading">
            <h2>Follow up</h2>
            <Link to="/admin/orders">All orders →</Link>
          </div>
          {data.dueFollowUps?.length ? (
            data.dueFollowUps.map((order) => (
              <div className="dashboard-row" key={order._id}>
                <span>
                  {order.delivery?.name || 'Customer'}
                  <small>
                    {order.productName} ·{' '}
                    {order.status === 'confirmed'
                      ? 'Arrange delivery'
                      : order.quoteStatus === 'sent'
                        ? 'Quote awaiting reply'
                        : 'Contact customer'}
                  </small>
                </span>
                <Link to={`/admin/orders?search=${order._id}`}>Open</Link>
              </div>
            ))
          ) : (
            <p>No follow-ups due.</p>
          )}
        </section>
        <section className="dashboard-panel">
          <div className="admin-panel-heading">
            <h2>Low stock</h2>
            <Link to="/admin/products">Inventory →</Link>
          </div>
          {data.lowStock?.length ? (
            data.lowStock.map((product) => (
              <div className="dashboard-row" key={product._id}>
                <span>{product.name}</span>
                <strong>{product.stockQuantity} left</strong>
              </div>
            ))
          ) : (
            <p>No low-stock products.</p>
          )}
        </section>
      </div>
      <section className="dashboard-panel admin-report-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Products generating enquiries</h2>
            <p>Quotation requests by product, from highest to lowest.</p>
          </div>
          <button
            type="button"
            className="admin-export-button"
            disabled={!productEnquiries.length}
            onClick={() =>
              downloadCsv(
                'k-star-light-product-enquiries.csv',
                ['Product', 'Total enquiries', 'New enquiries', 'Latest enquiry'],
                productEnquiries.map((row) => [
                  row.productName,
                  row.enquiries,
                  row.newEnquiries,
                  row.lastEnquiryAt
                ])
              )
            }
          >
            Export report CSV
          </button>
        </div>
        {reportLoading ? (
          <p role="status">Loading report…</p>
        ) : reportError ? (
          <p>
            Report unavailable.{' '}
            <button type="button" onClick={retryReport}>
              Try again
            </button>
          </p>
        ) : productEnquiries.length ? (
          <div className="admin-report-list">
            {productEnquiries.slice(0, 10).map((row) => (
              <div className="dashboard-row" key={row.productId}>
                <span>
                  {row.productName}
                  <small>
                    {row.newEnquiries} new · latest{' '}
                    {new Date(row.lastEnquiryAt).toLocaleDateString('en-IN')}
                  </small>
                </span>
                <strong>{row.enquiries} enquiries</strong>
              </div>
            ))}
          </div>
        ) : (
          <p>No product enquiries recorded yet.</p>
        )}
      </section>
      <div className="admin-quick-links">
        <Link to="/admin/manual-orders">Record a manual order →</Link>
        <Link to="/admin/customers">View customer directory →</Link>
        <Link to="/admin/enquiries">Review enquiries →</Link>
      </div>
    </main>
  )
}

export default AdminDashboard

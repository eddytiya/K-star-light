import { Link } from 'react-router-dom'

const AdminLoadState = ({ loading, error, onRetry, empty, emptyTitle, emptyMessage, actionTo, actionLabel, children }) => {
  if (loading) return <div className="state-card admin-state" role="status"><span className="admin-state-symbol" aria-hidden="true">◌</span><h2>Loading…</h2><p>Getting the latest information.</p></div>
  if (error) return <div className="state-card admin-state admin-error-state" role="alert"><span className="admin-state-symbol" aria-hidden="true">!</span><h2>Could not load this section</h2><p>{error}</p><button className="primary-button" type="button" onClick={onRetry}>Try again</button></div>
  if (empty) return <div className="state-card admin-state"><span className="admin-state-symbol" aria-hidden="true">+</span><h2>{emptyTitle}</h2><p>{emptyMessage}</p>{actionTo && <Link className="primary-button" to={actionTo}>{actionLabel}</Link>}</div>
  return children
}

export default AdminLoadState

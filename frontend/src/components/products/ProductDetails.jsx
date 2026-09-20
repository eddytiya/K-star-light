import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import productApi from './productApi'
import AdminLoadState from '../admin/AdminLoadState'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    productApi.get(`/${id}`).then(({ data }) => setProduct(data)).catch((failure) => setError(failure.response?.data?.message || 'Could not load product.'))
  }, [id, loadKey])

  const remove = async () => {
    if (!window.confirm(`Delete “${product.name}”?`)) return
    try {
      await productApi.delete(`/${id}`)
      showSuccess('Product deleted')
      navigate('/admin/products')
    } catch (error) { showError(error.response?.data?.message || 'Could not delete product') }
  }

  if (!product) return <main className="product-page"><AdminLoadState loading={!error} error={error} onRetry={() => { setError(''); setLoadKey((value) => value + 1) }} /></main>

  return (
    <main className="product-page narrow">
      <div className="detail-actions"><Link to="/admin/products">← All products</Link><div><Link className="secondary-button" to={`/admin/products/${id}/edit`}>Edit</Link><button className="danger-button" type="button" onClick={remove}>Delete</button></div></div>
      <article className="product-detail">
        <div className="detail-image">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <span>💡</span>}</div>
        <div><span className="eyebrow">{product.category?.name || 'Unassigned'}</span><h1>{product.name}</h1><p className="detail-description">{product.description}</p><h2>₹{product.price.toLocaleString('en-IN')}</h2>
          <dl><div><dt>Brand</dt><dd>{product.brand}</dd></div><div><dt>Wattage</dt><dd>{product.wattage}</dd></div><div><dt>Light colour</dt><dd>{product.lightColour}</dd></div><div><dt>Usage</dt><dd>{product.usage}</dd></div><div><dt>Inventory</dt><dd>{product.stockQuantity} · {product.stockStatus}</dd></div><div><dt>Low-stock alert</dt><dd>{product.lowStockThreshold ?? 5} units</dd></div><div><dt>Status</dt><dd>{product.status}{product.featured ? ' · Featured' : ''}</dd></div><div><dt>Slug</dt><dd>{product.slug}</dd></div></dl>
        </div>
      </article>
      <section className="history-panel"><h2>Inventory history</h2>{product.inventoryHistory?.length ? [...product.inventoryHistory].reverse().map((entry) => <div className="history-row" key={entry._id}><div><strong>{entry.change > 0 ? `+${entry.change}` : entry.change}</strong><span>{entry.previousQuantity} → {entry.newQuantity} units</span></div><div><span>{entry.note}</span><small>{new Date(entry.createdAt).toLocaleString('en-IN')}</small></div></div>) : <p>No stock adjustments recorded yet.</p>}</section>
    </main>
  )
}

export default ProductDetails

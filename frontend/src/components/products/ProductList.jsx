import { Link } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import productApi from './productApi'
import useAdminData from '../admin/useAdminData'
import AdminLoadState from '../admin/AdminLoadState'

const ProductList = () => {
  const { data: products, setData: setProducts, loading, error, retry } = useAdminData('/products', [])

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}”?`)) return
    try {
      await productApi.delete(`/${product._id}`)
      setProducts((current) => current.filter((item) => item._id !== product._id))
      showSuccess('Product deleted')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not delete product')
    }
  }

  return (
    <main className="product-page">
      <nav className="section-nav"><Link to="/">Public catalogue</Link><Link className="active" to="/admin/products">Products</Link><Link to="/admin/categories">Categories</Link></nav>
      <header className="product-header">
        <div><span className="eyebrow">K STAR LIGHT</span><h1>Product inventory</h1><p>Create, view, update and delete lighting products.</p></div>
        <Link className="primary-button" to="/admin/products/new">Add product</Link>
      </header>

      <AdminLoadState loading={loading} error={error} onRetry={retry} empty={products.length === 0} emptyTitle="No products yet" emptyMessage="Add the first lighting product to start your catalogue." actionTo="/admin/products/new" actionLabel="Add product">
        <div className="product-table-wrap"><table className="product-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th aria-label="Actions" /></tr></thead>
          <tbody>{products.map((product) => (
            <tr key={product._id}>
              <td><div className="product-cell"><div className="thumbnail">{product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span>💡</span>}</div><div><strong>{product.name}</strong><small>{product.brand}</small></div></div></td>
              <td>{product.category?.name || 'Unassigned'}</td>
              <td>₹{product.price.toLocaleString('en-IN')}</td>
              <td><span className={product.stockQuantity > 0 ? 'stock in' : 'stock out'}>{product.stockStatus}</span><small>{product.stockQuantity} units</small></td>
              <td><span className={`status ${product.status}`}>{product.status}</span></td>
              <td><div className="row-actions"><Link to={`/admin/products/${product._id}`}>View</Link><Link to={`/admin/products/${product._id}/edit`}>Edit</Link><button type="button" onClick={() => removeProduct(product)}>Delete</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </AdminLoadState>
    </main>
  )
}

export default ProductList

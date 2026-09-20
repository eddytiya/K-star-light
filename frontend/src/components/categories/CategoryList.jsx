import { Link } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import categoryApi from './categoryApi'
import useAdminData from '../admin/useAdminData'
import AdminLoadState from '../admin/AdminLoadState'

const CategoryList = () => {
  const { data: categories, setData: setCategories, loading, error, retry } = useAdminData('/categories', [])

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete “${category.name}”?`)) return
    try {
      await categoryApi.delete(`/${category._id}`)
      setCategories((current) => current.filter((item) => item._id !== category._id))
      showSuccess('Category deleted')
    } catch (error) {
      showError(error.response?.data?.message || 'Could not delete category')
    }
  }

  return (
    <main className="product-page">
      <nav className="section-nav"><Link to="/">Public catalogue</Link><Link to="/admin/products">Products</Link><Link className="active" to="/admin/categories">Categories</Link></nav>
      <header className="product-header">
        <div><span className="eyebrow">K STAR LIGHT</span><h1>Categories</h1><p>Create any category your product catalogue needs.</p></div>
        <Link className="primary-button" to="/admin/categories/new">Add category</Link>
      </header>
      <AdminLoadState loading={loading} error={error} onRetry={retry} empty={categories.length === 0} emptyTitle="No categories yet" emptyMessage="Add a category before creating products." actionTo="/admin/categories/new" actionLabel="Add category">
        <div className="category-grid">{categories.map((category) => (
          <article className="category-card" key={category._id}>
            <div><span className="category-count">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</span><h2>{category.name}</h2><p>{category.description || 'No description added.'}</p><small>/{category.slug}</small></div>
            <div className="row-actions"><Link to={`/admin/categories/${category._id}/edit`}>Edit</Link><button type="button" onClick={() => removeCategory(category)}>Delete</button></div>
          </article>
        ))}</div>
      </AdminLoadState>
    </main>
  )
}

export default CategoryList

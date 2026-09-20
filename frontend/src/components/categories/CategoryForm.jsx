import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import categoryApi from './categoryApi'
import AdminLoadState from '../admin/AdminLoadState'

const CategoryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [category, setCategory] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    if (!editing) return
    categoryApi.get(`/${id}`)
      .then(({ data }) => setCategory({ name: data.name, description: data.description || '' }))
      .catch((error) => setLoadError(error.response?.data?.message || 'Could not load category.'))
      .finally(() => setLoading(false))
  }, [editing, id, loadKey])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) await categoryApi.put(`/${id}`, category)
      else await categoryApi.post('/', category)
      showSuccess(`Category ${editing ? 'updated' : 'created'}`)
      navigate('/admin/categories')
    } catch (error) {
      showError(error.response?.data?.errors?.join(', ') || error.response?.data?.message || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadError) return <main className="product-page"><AdminLoadState loading={loading} error={loadError} onRetry={() => { setLoading(true); setLoadKey((value) => value + 1) }} /></main>

  return (
    <main className="product-page narrow">
      <header className="form-header"><div><span className="eyebrow">K STAR LIGHT</span><h1>{editing ? 'Edit category' : 'Add category'}</h1></div><Link className="text-link" to="/admin/categories">Back to categories</Link></header>
      <form className="product-form" onSubmit={submit}>
        <section><h2>Category information</h2><div className="form-grid">
          <label className="full">Category name<input required maxLength="80" value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} placeholder="Enter any category name" /></label>
          <label className="full">Description <small>Optional</small><textarea maxLength="300" rows="4" value={category.description} onChange={(event) => setCategory({ ...category, description: event.target.value })} /></label>
        </div></section>
        <div className="form-actions"><Link className="secondary-button" to="/admin/categories">Cancel</Link><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : editing ? 'Update category' : 'Create category'}</button></div>
      </form>
    </main>
  )
}

export default CategoryForm

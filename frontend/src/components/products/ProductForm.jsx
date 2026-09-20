import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import productApi from './productApi'
import categoryApi from '../categories/categoryApi'
import { apiClient } from '../../utils/apiClient'
import AdminLoadState from '../admin/AdminLoadState'

const emptyProduct = { name: '', category: '', description: '', price: '', images: '', brand: '', wattage: '', lightColour: '', usage: '', fittingType: '', dimensions: '', brightness: '', colourTemperature: '', warranty: '', installationNotes: '', stockQuantity: '', lowStockThreshold: 5, stockNote: '', featured: false, status: 'draft' }

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [product, setProduct] = useState(emptyProduct)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [loadKey, setLoadKey] = useState(0)

  useEffect(() => {
    const productRequest = editing ? productApi.get(`/${id}`) : Promise.resolve(null)
    Promise.all([categoryApi.get('/'), productRequest])
      .then(([categoryResponse, productResponse]) => {
        setCategories(categoryResponse.data)
        if (productResponse) {
          const data = productResponse.data
          setProduct({ ...data, category: data.category?._id || '', images: data.images?.join('\n') || '' })
        }
      })
      .catch((error) => setLoadError(error.response?.data?.message || 'Could not load product form data.'))
      .finally(() => setLoading(false))
  }, [editing, id, loadKey])

  const updateField = ({ target }) => {
    const { name, type, checked, value } = target
    setProduct((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const uploadImages = async (event) => {
    const files = [...event.target.files]
    if (!files.length) return
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    setUploading(true)
    try {
      const { data } = await apiClient.post('/uploads', formData)
      setProduct((current) => ({ ...current, images: [current.images, ...data.images].filter(Boolean).join('\n') }))
      showSuccess('Images uploaded')
    } catch (error) { showError(error.response?.data?.message || 'Could not upload images') }
    finally { setUploading(false); event.target.value = '' }
  }

  const removeImage = (image) => setProduct((current) => ({ ...current, images: current.images.split(/\n|,/).map((item) => item.trim()).filter((item) => item && item !== image).join('\n') }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = { ...product, price: Number(product.price), stockQuantity: Number(product.stockQuantity), images: product.images.split(/\n|,/).map((image) => image.trim()).filter(Boolean) }
    ;['_id', 'slug', 'stockStatus', 'createdAt', 'updatedAt', '__v', 'id'].forEach((field) => delete payload[field])
    try {
      if (editing) await productApi.put(`/${id}`, payload)
      else await productApi.post('/', payload)
      showSuccess(`Product ${editing ? 'updated' : 'created'}`)
      navigate('/admin/products')
    } catch (error) {
      showError(error.response?.data?.errors?.join(', ') || error.response?.data?.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadError) return <main className="product-page"><AdminLoadState loading={loading} error={loadError} onRetry={() => { setLoading(true); setLoadKey((value) => value + 1) }} /></main>

  return (
    <main className="product-page narrow">
      <header className="form-header"><div><span className="eyebrow">K STAR LIGHT</span><h1>{editing ? 'Edit product' : 'Add product'}</h1></div><Link className="text-link" to="/admin/products">Back to products</Link></header>
      <form className="product-form" onSubmit={submit}>
        <section><h2>Product information</h2><div className="form-grid">
          <label>Product name<input required name="name" value={product.name} onChange={updateField} /></label>
          <label>Category<select required name="category" value={product.category} onChange={updateField}><option value="">Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>{categories.length === 0 && <small>No categories available. Add one from Categories first.</small>}</label>
          <label>Brand<input required name="brand" value={product.brand} onChange={updateField} /></label>
          <label>Wattage<input required name="wattage" placeholder="e.g. 30W" value={product.wattage} onChange={updateField} /></label>
          <label>Light colour<input required name="lightColour" placeholder="e.g. Cool White" value={product.lightColour} onChange={updateField} /></label>
          <label>Usage<select required name="usage" value={product.usage} onChange={updateField}><option value="">Select usage</option><option>Indoor</option><option>Outdoor</option><option>Commercial</option></select></label>
          <label>Fitting type<input name="fittingType" placeholder="e.g. B22 or recessed" value={product.fittingType || ''} onChange={updateField} /></label>
          <label>Dimensions<input name="dimensions" placeholder="e.g. 120 × 60 mm" value={product.dimensions || ''} onChange={updateField} /></label>
          <label>Brightness<input name="brightness" placeholder="e.g. 1800 lumens" value={product.brightness || ''} onChange={updateField} /></label>
          <label>Colour temperature<input name="colourTemperature" placeholder="e.g. 3000K" value={product.colourTemperature || ''} onChange={updateField} /></label>
          <label>Warranty<input name="warranty" placeholder="e.g. 2 years" value={product.warranty || ''} onChange={updateField} /></label>
          <label>Installation notes<input name="installationNotes" value={product.installationNotes || ''} onChange={updateField} /></label>
          <label className="full">Description<textarea required rows="5" name="description" value={product.description} onChange={updateField} /></label>
          <label className="full">Product images <small>JPEG, PNG or WebP · maximum 5 MB each</small><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadImages} disabled={uploading} />{uploading && <small>Uploading…</small>}</label>
          {product.images && <div className="image-previews full">{product.images.split(/\n|,/).map((image) => image.trim()).filter(Boolean).map((image) => <div key={image}><img src={image} alt="Product preview" /><button type="button" onClick={() => removeImage(image)}>×</button></div>)}</div>}
          <label className="full">Or add image URLs <small>One URL per line</small><textarea rows="3" name="images" value={product.images} onChange={updateField} /></label>
        </div></section>
        <section><h2>Price and inventory</h2><div className="form-grid">
          <label>Price (₹)<input required min="0" step="0.01" type="number" name="price" value={product.price} onChange={updateField} /></label>
          <label>Stock quantity<input required min="0" step="1" type="number" name="stockQuantity" value={product.stockQuantity} onChange={updateField} /></label>
          <label>Low-stock warning at<input required min="0" step="1" type="number" name="lowStockThreshold" value={product.lowStockThreshold} onChange={updateField} /></label>
          {editing && <label>Stock adjustment note<input name="stockNote" value={product.stockNote || ''} onChange={updateField} placeholder="e.g. New stock received" /></label>}
          <label>Publishing status<select name="status" value={product.status} onChange={updateField}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="checkbox-label"><input type="checkbox" name="featured" checked={product.featured} onChange={updateField} /> Featured product</label>
        </div></section>
        <div className="form-actions"><Link className="secondary-button" to="/admin/products">Cancel</Link><button className="primary-button" disabled={saving} type="submit">{saving ? 'Saving…' : editing ? 'Update product' : 'Create product'}</button></div>
      </form>
    </main>
  )
}

export default ProductForm

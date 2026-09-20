import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { showError, showSuccess } from '../../utils/toastUtils'
import { apiClient } from '../../utils/apiClient'
import catalogueApi from './catalogueApi'
import PublicNav from './PublicNav'
import { addToCart } from '../../utils/cart'
import PriceNotice from './PriceNotice'
import './catalogue.css'

const CatalogueDetails = () => {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [showQuote, setShowQuote] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [enquiry, setEnquiry] = useState({
    customerName: '',
    phone: '',
    city: '',
    quantity: 1,
    message: ''
  })

  useEffect(() => {
    catalogueApi
      .get(`/${slug}`)
      .then(({ data }) => setProduct(data))
      .catch((error) => showError(error.response?.data?.message || 'Could not load product'))
  }, [slug])

  const submitEnquiry = async (event) => {
    event.preventDefault()
    setSending(true)
    try {
      await apiClient.post('/enquiries', {
        ...enquiry,
        quantity: Number(enquiry.quantity),
        product: product._id
      })
      showSuccess('Quotation request sent successfully')
      setShowQuote(false)
      setEnquiry({ customerName: '', phone: '', city: '', quantity: 1, message: '' })
    } catch (error) {
      showError(error.response?.data?.message || 'Could not send request')
    } finally {
      setSending(false)
    }
  }

  if (!product)
    return (
      <div className="public-site">
        <div className="catalogue-empty">Loading product…</div>
      </div>
    )

  return (
    <div className="public-site">
      <PublicNav />
      <main className="public-detail-page">
        <Link className="back-link" to="/">
          ← Back to catalogue
        </Link>
        <article className="public-detail">
          <div>
            <div className="public-detail-image">
              {product.images?.[activeImage] ? (
                <img
                  src={product.images[activeImage]}
                  alt={`${product.name} view ${activeImage + 1}`}
                />
              ) : (
                <span>💡</span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="product-thumbnails">
                {product.images.map((src, index) => (
                  <button
                    type="button"
                    key={src}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={activeImage === index}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="public-detail-content">
            <span className="catalogue-category">{product.category?.name}</span>
            <h1>{product.name}</h1>
            <p className="public-brand">{product.brand}</p>
            <p className="public-description">{product.description}</p>
            <div className="public-price">₹{product.price.toLocaleString('en-IN')}</div>
            <PriceNotice />
            <span
              className={
                product.stockStatus === 'In Stock' ? 'public-stock in' : 'public-stock out'
              }
            >
              {product.stockStatus}
            </span>
            <dl>
              <div>
                <dt>Wattage</dt>
                <dd>{product.wattage}</dd>
              </div>
              <div>
                <dt>Light colour</dt>
                <dd>{product.lightColour}</dd>
              </div>
              <div>
                <dt>Best for</dt>
                <dd>{product.usage}</dd>
              </div>
              {[
                ['Fitting', product.fittingType],
                ['Dimensions', product.dimensions],
                ['Brightness', product.brightness],
                ['Colour temperature', product.colourTemperature],
                ['Warranty', product.warranty],
                ['Installation', product.installationNotes]
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="purchase-note">
              Delivery across India. Delivery cost and timing are confirmed before fulfilment. Local
              installation may be available—contact us to check.
            </p>
            <div className="quote-actions">
              <Link className="enquiry-button" to={`/checkout/${product.slug}`}>
                Order now
              </Link>
              {product.stockStatus === 'In Stock' && (
                <button
                  className="enquiry-button"
                  type="button"
                  onClick={() => {
                    addToCart(product)
                    showSuccess('Added to cart')
                  }}
                >
                  Add to cart
                </button>
              )}
              <button className="enquiry-button" type="button" onClick={() => setShowQuote(true)}>
                Request a quote
              </button>
              <a
                href={`https://wa.me/919920591596?text=${encodeURIComponent(`Hello, I am interested in ${product.name}.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </article>
      </main>
      {showQuote && (
        <div className="quote-modal" role="dialog" aria-modal="true">
          <form onSubmit={submitEnquiry}>
            <button className="modal-close" type="button" onClick={() => setShowQuote(false)}>
              ×
            </button>
            <span className="catalogue-category">REQUEST QUOTATION</span>
            <h2>{product.name}</h2>
            <div className="quote-grid">
              <label>
                Name
                <input
                  required
                  value={enquiry.customerName}
                  onChange={(event) => setEnquiry({ ...enquiry, customerName: event.target.value })}
                />
              </label>
              <label>
                Phone
                <input
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  value={enquiry.phone}
                  onChange={(event) => setEnquiry({ ...enquiry, phone: event.target.value })}
                />
              </label>
              <label>
                City
                <input
                  required
                  value={enquiry.city}
                  onChange={(event) => setEnquiry({ ...enquiry, city: event.target.value })}
                />
              </label>
              <label>
                Quantity
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={enquiry.quantity}
                  onChange={(event) => setEnquiry({ ...enquiry, quantity: event.target.value })}
                />
              </label>
              <label className="full">
                Message <small>Optional</small>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={enquiry.message}
                  onChange={(event) => setEnquiry({ ...enquiry, message: event.target.value })}
                />
              </label>
            </div>
            <button className="enquiry-button" disabled={sending}>
              {sending ? 'Sending…' : 'Send request'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default CatalogueDetails

import { Link } from 'react-router-dom'
import { addToCart } from '../../utils/cart'
import { showSuccess } from '../../utils/toastUtils'
import PriceNotice from './PriceNotice'

const ProductCard = ({ product, onCompare, compared = false }) => (
  <article className="catalogue-card">
    <Link className="catalogue-image" to={`/catalogue/${product.slug}`}>
      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <span>💡</span>}
      {product.featured && <small>Featured</small>}
    </Link>
    <div className="catalogue-card-body">
      <span className="catalogue-category">{product.category?.name}</span>
      <Link className="catalogue-name" to={`/catalogue/${product.slug}`}>{product.name}</Link>
      <p>{product.brand} · {product.wattage} · {product.lightColour}</p>
      <div className="catalogue-card-footer">
        <strong>₹{product.price.toLocaleString('en-IN')}</strong>
        <span className={product.stockStatus === 'In Stock' ? 'public-stock in' : 'public-stock out'}>{product.stockStatus}</span>
      </div>
      <PriceNotice compact />
      {onCompare && <button className="compare-toggle" type="button" aria-pressed={compared} onClick={() => onCompare(product)}>{compared ? '✓ Comparing' : 'Compare'}</button>}
      {product.stockStatus === 'In Stock' && <button className="card-add" type="button" onClick={() => { addToCart(product); showSuccess('Added to cart') }}>Add to cart</button>}
    </div>
  </article>
)

export default ProductCard

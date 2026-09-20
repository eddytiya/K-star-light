import { useEffect, useMemo, useState } from 'react'
import { showError } from '../../utils/toastUtils'
import catalogueApi from './catalogueApi'
import ProductCard from './ProductCard'
import PublicNav from './PublicNav'
import './catalogue.css'

const initialFilters = { q: '', category: '', wattage: '', colour: '', usage: '', fitting: '', brightness: '', minPrice: '', maxPrice: '', sort: 'newest' }

const CatalogueHome = () => {
  const [products, setProducts] = useState([])
  const [featured, setFeatured] = useState([])
  const [options, setOptions] = useState({ categories: [], wattages: [], colours: [], usages: [], fittings: [], brightnesses: [] })
  const [compared, setCompared] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')), [filters])

  useEffect(() => {
    Promise.all([
      catalogueApi.get('/filters'),
      catalogueApi.get('/', { params: { featured: true, limit: 4 } })
    ]).then(([filterResponse, featuredResponse]) => {
      const filtersFromApi = filterResponse.data || {}
      setOptions({
        categories: Array.isArray(filtersFromApi.categories) ? filtersFromApi.categories : [],
        wattages: Array.isArray(filtersFromApi.wattages) ? filtersFromApi.wattages : [],
        colours: Array.isArray(filtersFromApi.colours) ? filtersFromApi.colours : [],
        usages: Array.isArray(filtersFromApi.usages) ? filtersFromApi.usages : [],
        fittings: Array.isArray(filtersFromApi.fittings) ? filtersFromApi.fittings : [],
        brightnesses: Array.isArray(filtersFromApi.brightnesses) ? filtersFromApi.brightnesses : []
      })
      setFeatured(Array.isArray(featuredResponse.data) ? featuredResponse.data : featuredResponse.data.products || [])
    }).catch(() => showError('Could not load catalogue information'))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      catalogueApi.get('/', { params: { ...params, page, limit: 24 } })
        .then(({ data }) => { const list = Array.isArray(data) ? data : data.products || []; setProducts(list); setTotal(Array.isArray(data) ? list.length : data.total || 0) })
        .catch((error) => showError(error.response?.data?.message || 'Could not load products'))
        .finally(() => setLoading(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [params, page])

  const updateFilter = ({ target }) => { setPage(1); setFilters((current) => ({ ...current, [target.name]: target.value })) }
  const toggleCompare = (product) => setCompared((current) => current.some((item) => item._id === product._id) ? current.filter((item) => item._id !== product._id) : current.length < 3 ? [...current, product] : current)

  return (
    <div className="public-site">
      <PublicNav />

      <main>
        <section className="catalogue-hero">
          <div><span className="hero-kicker">LIGHTING FOR EVERY SPACE</span><h1>Bright ideas.<br />Built to last.</h1><p>Quality lighting for homes, streets and commercial spaces—with delivery across India.</p><a className="hero-button" href="#catalogue">Explore products</a></div>
          <div className="hero-light"><span /><div>Energy-efficient<br /><strong>lighting solutions</strong></div></div>
        </section>

        {featured.length > 0 && <section className="catalogue-section featured-section"><div className="section-heading"><div><span>HANDPICKED</span><h2>Featured lights</h2></div><a href="#catalogue">View all products →</a></div><div className="catalogue-grid">{featured.map((product) => <ProductCard key={product._id} product={product} onCompare={toggleCompare} compared={compared.some((item) => item._id === product._id)} />)}</div></section>}

        <section className="catalogue-section" id="catalogue">
          <div className="section-heading"><div><span>OUR COLLECTION</span><h2>Find the right light</h2></div><p>{total} {total === 1 ? 'product' : 'products'}</p></div>

          <div className="catalogue-tools">
            <label className="catalogue-search"><span>⌕</span><input name="q" value={filters.q} onChange={updateFilter} placeholder="Search by product or brand" /></label>
            <select name="category" value={filters.category} onChange={updateFilter}><option value="">All categories</option>{options.categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select>
            <select name="wattage" value={filters.wattage} onChange={updateFilter}><option value="">All wattages</option>{options.wattages.map((value) => <option key={value}>{value}</option>)}</select>
            <select name="colour" value={filters.colour} onChange={updateFilter}><option value="">All colours</option>{options.colours.map((value) => <option key={value}>{value}</option>)}</select>
            <select name="usage" value={filters.usage} onChange={updateFilter}><option value="">All uses</option>{options.usages.map((value) => <option key={value}>{value}</option>)}</select>
            <select name="fitting" value={filters.fitting} onChange={updateFilter}><option value="">All fittings</option>{options.fittings.map((value) => <option key={value}>{value}</option>)}</select>
            <select name="brightness" value={filters.brightness} onChange={updateFilter}><option value="">All brightness levels</option>{options.brightnesses.map((value) => <option key={value}>{value}</option>)}</select>
            <label className="price-field"><span>₹</span><input type="number" min="0" name="minPrice" value={filters.minPrice} onChange={updateFilter} placeholder="Min price" /></label>
            <label className="price-field"><span>₹</span><input type="number" min="0" name="maxPrice" value={filters.maxPrice} onChange={updateFilter} placeholder="Max price" /></label>
            <select name="sort" value={filters.sort} onChange={updateFilter}><option value="newest">Newest first</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option></select>
            <button className="clear-filters" type="button" onClick={() => { setFilters(initialFilters); setPage(1) }}>Clear filters</button>
          </div>
          {Object.entries(filters).filter(([key, value]) => value && key !== 'sort').length > 0 && <div className="active-filters" aria-label="Applied filters">{Object.entries(filters).filter(([key, value]) => value && key !== 'sort').map(([key, value]) => <button type="button" key={key} onClick={() => { setPage(1); setFilters((current) => ({ ...current, [key]: '' })) }}>{key === 'category' ? options.categories.find((item) => item._id === value)?.name || 'Category' : `${key}: ${value}`} ×</button>)}</div>}

          {loading ? <div className="catalogue-empty">Loading products…</div> : products.length > 0 ? <div className="catalogue-grid">{products.map((product) => <ProductCard key={product._id} product={product} onCompare={toggleCompare} compared={compared.some((item) => item._id === product._id)} />)}</div> : <div className="catalogue-empty"><span>💡</span><h3>No matching products</h3><p>Try changing or clearing your filters.</p></div>}
          {compared.length > 0 && <section className="compare-panel" aria-label="Compare selected lights"><div className="compare-heading"><h3>Compare lights ({compared.length}/3)</h3><button type="button" onClick={() => setCompared([])}>Clear</button></div><div className="compare-scroll"><table><thead><tr><th>Feature</th>{compared.map((item) => <th key={item._id}>{item.name}<button type="button" aria-label={`Remove ${item.name} from comparison`} onClick={() => toggleCompare(item)}>×</button></th>)}</tr></thead><tbody>{[['Price', (item) => `₹${item.price.toLocaleString('en-IN')}`], ['Wattage', (item) => item.wattage], ['Brightness', (item) => item.brightness || 'Ask us'], ['Fitting', (item) => item.fittingType || 'Ask us'], ['Use', (item) => item.usage], ['Light colour', (item) => item.lightColour], ['Warranty', (item) => item.warranty || 'Ask us']].map(([label, value]) => <tr key={label}><th>{label}</th>{compared.map((item) => <td key={item._id}>{value(item)}</td>)}</tr>)}</tbody></table></div><p>Displayed prices may change with market rates. Confirm the final price with Santosh.</p></section>}
          {total > 24 && <div className="catalogue-pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / 24)}</span><button disabled={page * 24 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
        </section>

        <section className="buying-guide"><h2>Choose a light in three steps</h2><div><article><strong>1. Pick the space</strong><p>Use Indoor, Outdoor or Commercial to narrow the catalogue.</p></article><article><strong>2. Check the fit</strong><p>Compare wattage, fitting type, size and brightness on each product page.</p></article><article><strong>3. Ask when unsure</strong><p>Send a quotation request or call us before placing an order.</p></article></div></section>

        <section className="contact-strip" id="contact"><div><span>NEED HELP CHOOSING?</span><h2>Talk to K Star Light</h2><p>Delivery across India · Local installation available</p></div><div className="contact-buttons"><a href="tel:+919920591596">Call Santosh</a><a href="https://wa.me/919920591596" target="_blank" rel="noreferrer">WhatsApp</a></div></section>
      </main>
      <footer className="public-footer"><span>K STAR LIGHT</span><p>Quality lighting solutions for every space.</p></footer>
    </div>
  )
}

export default CatalogueHome

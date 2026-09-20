const key = 'kstarlightCart'

export const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

export const saveCart = (items) => {
  localStorage.setItem(key, JSON.stringify(items))
  window.dispatchEvent(new Event('cartChanged'))
}

export const addToCart = (product) => {
  const items = readCart()
  const existing = items.find((item) => item._id === product._id)
  if (existing) existing.quantity = Math.min(existing.quantity + 1, 100)
  else
    items.push({
      _id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      quantity: 1
    })
  saveCart(items)
}

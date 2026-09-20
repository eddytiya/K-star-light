const itemSummary = (order) =>
  (order.items?.length
    ? order.items
    : [{ productName: order.productName, quantity: order.quantity }]
  )
    .map((item) => item.productName + ' × ' + item.quantity)
    .join(', ')
const money = (value) => Number(value).toLocaleString('en-IN')
const chat = (phone, message) => 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message)

export const orderMessageLink = (order, kind, quoteUrl = '') => {
  const name = order.delivery?.name || 'there'
  const reference = String(order._id).slice(-8).toUpperCase()
  const products = itemSummary(order)
  if (kind === 'received')
    return chat(
      order.delivery.phone,
      'Hello ' +
        name +
        ', Santosh from K Star Light here. We received your request #' +
        reference +
        ' for ' +
        products +
        ". I'll confirm the current prices and delivery after checking the details."
    )
  if (kind === 'quote')
    return chat(
      order.delivery.phone,
      'Hello ' +
        name +
        ', your K Star Light quote for ' +
        products +
        ' is ₹' +
        money(order.quote.total) +
        ' including delivery, valid until ' +
        new Date(order.quote.validUntil).toLocaleDateString('en-IN') +
        '.' +
        (quoteUrl
          ? ' View and accept it here: ' + quoteUrl
          : ' Please check the quotation email or your My orders page to review and accept it.')
    )
  return chat(
    order.delivery.phone,
    'Hello ' +
      name +
      ', following up on your K Star Light request #' +
      reference +
      ' for ' +
      products +
      '. Please let me know if you have any questions or would like to proceed.'
  )
}

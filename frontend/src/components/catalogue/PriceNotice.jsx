import './priceNotice.css'

const PriceNotice = ({ compact = false }) => (
  <p className={`price-notice${compact ? ' price-notice-compact' : ''}`}>
    <span aria-hidden="true">!</span> Prices may change with market rates. Final price is confirmed
    with you before payment.
  </p>
)

export default PriceNotice

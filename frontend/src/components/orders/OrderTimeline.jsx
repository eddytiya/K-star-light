import { Link } from 'react-router-dom'

const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : ''
const eventDate = (order, status) =>
  order.statusHistory?.findLast((entry) => entry.status === status)?.at
const progress = ['placed', 'confirmed', 'shipped', 'completed']

const OrderTimeline = ({ order }) => {
  const current = progress.indexOf(order.status)
  const hasQuoteFlow = Boolean(
    order.quote?.sentAt || ['requested', 'sent', 'accepted', 'expired'].includes(order.quoteStatus)
  )
  const steps = [
    { label: 'Request received', date: order.createdAt, done: true },
    ...(hasQuoteFlow
      ? [
          { label: 'Quote sent', date: order.quote?.sentAt, done: Boolean(order.quote?.sentAt) },
          {
            label: 'Quote accepted',
            date: order.quote?.acceptedAt,
            done: Boolean(order.quote?.acceptedAt)
          }
        ]
      : [{ label: 'Order confirmed', date: eventDate(order, 'confirmed'), done: current >= 1 }]),
    { label: 'Dispatched', date: eventDate(order, 'shipped'), done: current >= 2 },
    { label: 'Delivered', date: eventDate(order, 'completed'), done: current >= 3 }
  ]
  return (
    <div className="customer-order-timeline">
      <h3>Order progress</h3>
      {order.status === 'cancelled' && (
        <p className="timeline-alert">
          This order was cancelled
          {eventDate(order, 'cancelled') ? ' on ' + dateText(eventDate(order, 'cancelled')) : ''}.
        </p>
      )}
      <ol>
        {steps.map((step, index) => (
          <li key={step.label} className={step.done ? 'done' : 'pending'}>
            <span className="timeline-dot" aria-hidden="true">
              {step.done ? '✓' : index + 1}
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.done ? dateText(step.date) || 'Date not recorded' : 'Pending'}</small>
            </div>
          </li>
        ))}
      </ol>
      {order.quoteStatus === 'sent' && order.status === 'placed' && (
        <p>
          <Link to={'/quote/' + order._id}>Review and accept Santosh’s quote</Link>
        </p>
      )}
      {order.quoteStatus === 'requested' && (
        <p>Santosh will confirm the final price and delivery.</p>
      )}
      {order.quoteStatus === 'expired' && (
        <p>Quote expired. Contact Santosh for an updated price.</p>
      )}
      {order.trackingUrl && order.status !== 'cancelled' && (
        <p>
          <a href={order.trackingUrl} target="_blank" rel="noreferrer">
            Track with courier ↗
          </a>
          {order.trackingNumber ? ' · ' + order.trackingNumber : ''}
        </p>
      )}
      {!order.trackingUrl && order.trackingNumber && (
        <p>Courier reference: {order.trackingNumber}</p>
      )}
      {order.status === 'shipped' && !order.trackingUrl && !order.trackingNumber && (
        <small>Contact us for delivery updates.</small>
      )}
    </div>
  )
}

export default OrderTimeline

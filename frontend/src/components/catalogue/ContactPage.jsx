import PublicNav from './PublicNav'
import './catalogue.css'

const ContactPage = () => <div className="public-site"><PublicNav /><main className="contact-page"><section><span className="hero-kicker">LET'S TALK LIGHTING</span><h1>We’re here to help.</h1><p>Tell us what you need and we’ll help you choose the right lighting solution for your home, street or commercial project.</p><div className="contact-cards"><a href="tel:+919920591596"><small>CALL US</small><strong>+91 99205 91596</strong><span>Santosh Pathak</span></a><a href="https://wa.me/919920591596" target="_blank" rel="noreferrer"><small>WHATSAPP</small><strong>Start a conversation</strong><span>Quick quotation support</span></a></div></section><aside><h2>Business information</h2><dl><div><dt>Delivery</dt><dd>Across India</dd></div><div><dt>Installation</dt><dd>Available locally</dd></div><div><dt>Payments</dt><dd>Cash or UPI outside the website</dd></div><div><dt>Products</dt><dd>Indoor, outdoor and commercial lighting</dd></div></dl></aside></main></div>

export default ContactPage

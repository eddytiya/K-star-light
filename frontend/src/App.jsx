import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProductList from './components/products/ProductList'
import ProductForm from './components/products/ProductForm'
import ProductDetails from './components/products/ProductDetails'
import CategoryList from './components/categories/CategoryList'
import CategoryForm from './components/categories/CategoryForm'
import CatalogueHome from './components/catalogue/CatalogueHome'
import CatalogueDetails from './components/catalogue/CatalogueDetails'
import ContactPage from './components/catalogue/ContactPage'
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import EnquiryList from './components/admin/EnquiryList'
import ProtectedRoute from './auth/ProtectedRoute'
import CustomerLogin from './components/orders/CustomerLogin'
import Checkout from './components/orders/Checkout'
import MyOrders from './components/orders/MyOrders'
import OrderList from './components/admin/OrderList'
import ManualOrders from './components/admin/ManualOrders'
import Cart from './components/orders/Cart'
import CustomerAccount from './components/orders/CustomerAccount'
import QuotePage from './components/orders/QuotePage'
import CustomerRecords from './components/admin/CustomerRecords'
import './components/products/products.css'

document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<CatalogueHome />} />
      <Route path="/catalogue/:slug" element={<CatalogueDetails />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/checkout/:slug" element={<Checkout />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/account" element={<CustomerAccount />} />
      <Route path="/quote/:id" element={<QuotePage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute><AdminLayout><ProductList /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products/new" element={<ProtectedRoute><AdminLayout><ProductForm /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products/:id" element={<ProtectedRoute><AdminLayout><ProductDetails /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/products/:id/edit" element={<ProtectedRoute><AdminLayout><ProductForm /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute><AdminLayout><CategoryList /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/categories/new" element={<ProtectedRoute><AdminLayout><CategoryForm /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/categories/:id/edit" element={<ProtectedRoute><AdminLayout><CategoryForm /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/enquiries" element={<ProtectedRoute><AdminLayout><EnquiryList /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute><AdminLayout><OrderList /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/manual-orders" element={<ProtectedRoute><AdminLayout><ManualOrders /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute><AdminLayout><CustomerRecords /></AdminLayout></ProtectedRoute>} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App

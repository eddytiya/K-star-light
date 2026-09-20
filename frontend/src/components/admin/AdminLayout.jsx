import AdminNav from './AdminNav'
import './admin.css'

const AdminLayout = ({ children }) => (
  <>
    <AdminNav />
    {children}
  </>
)

export default AdminLayout

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function Admin() {
  const { user } = useContext(AuthContext)
  console.log('Admin rendering, user:', user)
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <h1 className="display-4 fw-bold text-dark mb-4">Admin Dashboard</h1>
      <p className="text-muted">Welcome, {user?.username || 'Admin'}! Admin features coming soon.</p>
    </div>
  )
}

export default Admin
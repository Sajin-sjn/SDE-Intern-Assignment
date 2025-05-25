import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function Dashboard() {
  const { user } = useContext(AuthContext)
  console.log('Dashboard rendering, user:', user)
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <h1 className="display-4 fw-bold text-dark mb-4">User Dashboard</h1>
      <p className="text-muted">Welcome, {user?.username || 'User'}! Your learning dashboard is coming soon.</p>
    </div>
  )
}

export default Dashboard
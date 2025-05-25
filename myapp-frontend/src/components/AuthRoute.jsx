import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function AuthRoute({ children, adminOnly = false, userOnly = false }) {
  const { user, loading } = useContext(AuthContext)
  console.log('AuthRoute check:', {
    user,
    loading,
    adminOnly,
    userOnly,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  })

  if (loading) {
    console.log('AuthRoute loading, rendering spinner')
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('Redirecting to /login: No user')
    return <Navigate to="/login" />
  }
  if (adminOnly && !user.is_admin) {
    console.log('Redirecting to /dashboard: Not admin')
    return <Navigate to="/dashboard" />
  }
  if (userOnly && user.is_admin) {
    console.log('Redirecting to /admin: Admin user')
    return <Navigate to="/admin" />
  }
  console.log('AuthRoute rendering children:', children.type.name)
  return children
}

export default AuthRoute
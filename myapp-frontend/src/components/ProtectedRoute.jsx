import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext)
  console.log('ProtectedRoute check:', { user, loading, path: window.location.pathname })

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.is_admin ? '/admin' : '/dashboard'} />
  }
  return children
}

export default ProtectedRoute
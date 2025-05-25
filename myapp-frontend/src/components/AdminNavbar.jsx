import { Link, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function AdminNavbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleManageVideosClick = (e) => {
    e.preventDefault()
    console.log('Manage Videos button clicked, user:', user, 'navigating to /admin_manage_videos')
    navigate('/admin_manage_videos', { replace: false })
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          Learning Platform
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn btn-link"
                onClick={handleManageVideosClick}
              >
                Manage Videos
              </button>
            </li>
            {/* <li className="nav-item">
              <span className="nav-link">{user?.username || 'No user'}</span>
            </li> */}
            <li className="nav-item">
              <button className="nav-link btn btn-link" onClick={logout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
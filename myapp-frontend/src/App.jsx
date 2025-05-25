import { Routes, Route } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import PublicNavbar from './components/PublicNavbar'
import AdminNavbar from './components/AdminNavbar'
import UserNavbar from './components/UserNavbar'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRoute from './components/AuthRoute'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import ManageVideos from './pages/ManageVideos'
import MyList from './pages/MyList'

function App() {
  const { user } = useContext(AuthContext)
  console.log('App rendering, user:', user, 'path:', window.location.pathname)

  return (
    <div className="min-vh-100 bg-light">
      {user ? (user.is_admin ? <AdminNavbar /> : <UserNavbar />) : <PublicNavbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/signup"
          element={
            <ProtectedRoute>
              <SignUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <ProtectedRoute>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-list"
          element={
            <AuthRoute userOnly>
              <MyList />
            </AuthRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthRoute adminOnly>
              <Admin />
            </AuthRoute>
          }
        />
        <Route
          path="/admin_manage_videos"
          element={
            <AuthRoute adminOnly>
              <ManageVideos />
            </AuthRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AuthRoute userOnly>
              <Dashboard />
            </AuthRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
import { createContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('Setting up axios interceptors, token:', token)
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers['Authorization'] = `Token ${token}`
        }
        console.log('Request:', config.method, config.url, config.headers)
        return config
      },
      (error) => {
        console.error('Request error:', error)
        return Promise.reject(error)
      }
    )

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response error:', error.response?.status, error.response?.data)
        if (error.response?.status === 401) {
          console.log('401 error, logging out')
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [token])

  useEffect(() => {
    if (user) {
      console.log('User state updated:', user, 'current path:', location.pathname)
      localStorage.setItem('user', JSON.stringify(user))
      const validAdminRoutes = ['/admin', '/admin_manage_videos']
      const validUserRoutes = ['/dashboard', '/my-list']
      if (user.is_admin && !validAdminRoutes.includes(location.pathname)) {
        console.log('Redirecting admin to /admin')
        navigate('/admin')
      } else if (!user.is_admin && !validUserRoutes.includes(location.pathname)) {
        console.log('Redirecting non-admin to /dashboard')
        navigate('/dashboard')
      }
    }
    setLoading(false)
  }, [user, navigate, location])

  useEffect(() => {
    if (token && !user) {
      console.log('Validating token:', token)
      setLoading(true)
      axios
        .get('http://localhost:8000/api/users/me/')
        .then((response) => {
          console.log('User data:', response.data)
          setUser({
            id: response.data.id,
            username: response.data.username,
            is_admin: response.data.is_admin,
          })
        })
        .catch((err) => {
          console.error('Token validation error:', err.response?.data)
          logout()
        })
    }
  }, [token])

  const login = async (username, password) => {
    try {
      console.log('Logging in:', username)
      setLoading(true)
      const response = await axios.post('http://localhost:8000/api/login/', {
        username,
        password,
      })
      const { token, username: userName, user_id, is_admin } = response.data
      console.log('Login response:', { token, userName, user_id, is_admin })
      setToken(token)
      setUser({ id: user_id, username: userName, is_admin })
      localStorage.setItem('token', token)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error.response?.data)
      setLoading(false)
      return { success: false, error: error.response?.data?.error || 'Login failed' }
    }
  }

  const register = async (username, email, password) => {
    try {
      console.log('Registering:', username)
      setLoading(true)
      const response = await axios.post('http://localhost:8000/api/users/register/', {
        username,
        email,
        password,
      })
      console.log('Register response:', response.data)
      setLoading(false)
      return { success: true, message: 'Registration successful' }
    } catch (error) {
      console.error('Register error:', error.response?.data)
      setLoading(false)
      return { success: false, error: error.response?.data?.error || 'Registration failed' }
    }
  }

  const logout = () => {
    console.log('Logging out')
    setToken(null)
    setUser(null)
    setLoading(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
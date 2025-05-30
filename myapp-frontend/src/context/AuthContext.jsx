// import { createContext, useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import axios from 'axios';
// import api from '../api/axios';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
//   const [token, setToken] = useState(localStorage.getItem('token') || null);
//   const [loading, setLoading] = useState(!!localStorage.getItem('token'));
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     console.log('[AuthContext] Setting up axios interceptors, token:', token);
//     const requestInterceptor = axios.interceptors.request.use(
//       (config) => {
//         if (token) {
//           config.headers['Authorization'] = `Token ${token}`;
//         }
//         console.log('[AuthContext] Request:', config.method, config.url, config.headers);
//         return config;
//       },
//       (error) => {
//         console.error('[AuthContext] Request error:', error);
//         return Promise.reject(error);
//       }
//     );

//     const responseInterceptor = axios.interceptors.response.use(
//       (response) => response,
//       (success) => {
//         console.error('[AuthContext] Response error:', success.response?.status, error.response?.data);
//         if (error.response?.status === 401) {
//           console.log('[AuthContext] 401 error, logging out');
//           logout();
//         }
//         return Promise.reject(error);
//       }
//     );

//     return () => {
//       axios.interceptors.request.eject(requestInterceptor);
//       axios.interceptors.response.eject(responseInterceptor);
//     };
//   }, [token]);

//   useEffect(() => {
//     if (user) {
//       console.log('[AuthContext] User state updated:', user, 'current path:', location.pathname);
//       localStorage.setItem('user', JSON.stringify(user));
//       const validAdminRoutes = ['/admin', '/admin_manage_videos'];
//       const validUserRoutes = ['/dashboard', '/my-list'];
//       if (user.is_admin && !validAdminRoutes.includes(location.pathname)) {
//         console.log('[AuthContext] Redirecting admin to /admin');
//         navigate('/admin');
//       } else if (!user.is_admin && !validUserRoutes.includes(location.pathname)) {
//         console.log('[AuthContext] Redirecting non-admin to /dashboard');
//         navigate('/dashboard');
//       }
//     }
//     setLoading(false);
//   }, [user, navigate, location]);

//   useEffect(() => {
//     if (token && !user) {
//       console.log('[AuthContext] Validating token:', token);
//       setLoading(true);
//       api
//         .get('/api/users/me/')
//         .then((response) => {
//           console.log('[AuthContext] User data:', response.data);
//           setUser({
//             id: response.data.id,
//             username: response.data.username,
//             is_admin: response.data.is_admin,
//           });
//         })
//         .catch((err) => {
//           console.error('[AuthContext] Token validation error:', err.response?.data);
//           logout();
//         })
//         .finally(() => setLoading(false));
//     }
//   }, [token]);

//   const login = async (username, password) => {
//     try {
//       console.log('[AuthContext] Logging in:', username);
//       setLoading(true);
//       const response = await api.post('/api/login/', {
//         username,
//         password,
//       });
//       const { token, username: userName, user_id, is_admin } = response.data;
//       console.log('[AuthContext] Login response:', { token, userName, user_id, is_admin });
//       setToken(token);
//       setUser({ id: user_id, username: userName, is_admin });
//       localStorage.setItem('token', token);
//       return { success: true };
//     } catch (error) {
//       console.error('[AuthContext] Login error:', error.response?.data);
//       setLoading(false);
//       return { success: false, error: error.response?.data?.error || 'Login failed' };
//     }
//   };

//   const register = async (username, email, password) => {
//     console.log('[AuthContext] Attempting to register:', { username, email });
//     try {
//       setLoading(true);
//       const response = await api.post('/api/users/register/', {
//         username,
//         email,
//         password,
//       });
//       console.log('[AuthContext] Register success:', response.data);
//       return { success: true, message: 'Registration successful' };
//     } catch (error) {
//       console.error('[AuthContext] Register error raw:', error);
//       console.log('[AuthContext] Register error response:', JSON.stringify(error.response?.data, null, 2));
//       const errorData = error.response?.data?.error;
//       let errorMessage = 'Registration failed';
//       if (errorData && typeof errorData === 'object') {
//         console.log('[AuthContext] Error data object:', errorData);
//         if (Array.isArray(errorData.username) && errorData.username.length > 0) {
//           errorMessage = errorData.username[0].toLowerCase().includes('already exists')
//             ? 'Username already exists. Please choose another.'
//             : errorData.username.join('; ');
//         } else if (Array.isArray(errorData.email) && errorData.email.length > 0) {
//           errorMessage = errorData.email.join('; ');
//         } else if (Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
//           errorMessage = errorData.non_field_errors.join('; ');
//         } else {
//           console.warn('[AuthContext] Unexpected error structure:', errorData);
//           errorMessage = Object.values(errorData).flat().join('; ') || 'Registration failed';
//         }
//       } else {
//         console.warn('[AuthContext] Error data not an object:', errorData);
//         errorMessage = errorData || 'Registration failed';
//       }
//       console.log('[AuthContext] Returning registration error:', errorMessage);
//       return { success: false, error: errorMessage };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     console.log('[AuthContext] Logging out');
//     setToken(null);
//     setUser(null);
//     setLoading(false);
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     navigate('/login');
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export { AuthContext };




import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      console.log('[AuthContext] User state updated:', user, 'current path:', location.pathname);
      localStorage.setItem('user', JSON.stringify(user));
      const validAdminRoutes = ['/admin', '/admin_manage_videos'];
      const validUserRoutes = ['/dashboard', '/my-list'];
      if (user.is_admin && !validAdminRoutes.includes(location.pathname)) {
        console.log('[AuthContext] Redirecting admin to /admin');
        navigate('/admin');
      } else if (!user.is_admin && !validUserRoutes.includes(location.pathname)) {
        console.log('[AuthContext] Redirecting non-admin to /dashboard');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  }, [user, navigate, location]);

  useEffect(() => {
    if (token && !user) {
      console.log('[AuthContext] Validating token:', token);
      setLoading(true);
      api
        .get('/api/users/me/')
        .then((response) => {
          console.log('[AuthContext] User data:', response.data);
          setUser({
            id: response.data.id,
            username: response.data.username,
            is_admin: response.data.is_admin,
          });
        })
        .catch((err) => {
          console.error('[AuthContext] Token validation error:', err.response?.data);
          logout();
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('[AuthContext] Logging in:', username);
      setLoading(true);
      const response = await api.post('/api/login/', {
        username,
        password,
      });
      const { token, username: userName, user_id, is_admin } = response.data;
      console.log('[AuthContext] Login response:', { token, userName, user_id, is_admin });
      setToken(token);
      setUser({ id: user_id, username: userName, is_admin });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, username: userName, is_admin }));
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login error:', error.response?.data);
      setLoading(false);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (username, email, password) => {
    console.log('[AuthContext] Attempting to register:', { username, email });
    try {
      setLoading(true);
      const response = await api.post('/api/users/register/', {
        username,
        email,
        password,
      });
      console.log('[AuthContext] Register success:', response.data);
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      console.error('[AuthContext] Register error:', error.response?.data);
      const errorData = error.response?.data?.error;
      let errorMessage = 'Registration failed';
      if (errorData && typeof errorData === 'object') {
        if (Array.isArray(errorData.username) && errorData.username.length > 0) {
          errorMessage = errorData.username[0].toLowerCase().includes('already exists')
            ? 'Username already exists. Please choose another.'
            : errorData.username.join('; ');
        } else if (Array.isArray(errorData.email) && errorData.email.length > 0) {
          errorMessage = errorData.email.join('; ');
        } else if (Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
          errorMessage = errorData.non_field_errors.join('; ');
        } else {
          errorMessage = Object.values(errorData).flat().join('; ') || 'Registration failed';
        }
      } else {
        errorMessage = errorData || 'Registration failed';
      }
      console.log('[AuthContext] Returning registration error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logging out');
    setToken(null);
    setUser(null);
    setLoading(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

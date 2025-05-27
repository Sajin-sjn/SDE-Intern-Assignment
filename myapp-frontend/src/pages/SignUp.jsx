import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    console.log('[SignUp] Form data updated:', { ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[SignUp] Form submitted with data:', formData);
    if (!formData.username || !formData.email || !formData.password) {
      alert('All fields are required');
      console.log('[SignUp] Client-side validation failed: All fields are required');
      return;
    }

    try {
      console.log('[SignUp] Calling register with:', formData);
      const result = await register(formData.username, formData.email, formData.password);
      console.log('[SignUp] Registration result received:', result);

      if (result.success) {
        console.log('[SignUp] Registration successful, showing alert and navigating to /login');
        alert('Registration successful');
        setFormData({ username: '', email: '', password: '' });
        navigate('/login');
      } else {
        console.log('[SignUp] Registration failed, showing alert:', result.error);
        alert(typeof result.error === 'string' ? result.error : 'Registration failed');
      }
    } catch (err) {
      console.error('[SignUp] Unexpected error during registration:', err);
      alert('An unexpected error occurred');
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 className="display-5 fw-bold text-dark mb-4 text-center">Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        <p className="text-center mt-3">
          Already have an account? <Link to="/login" className="text-primary">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
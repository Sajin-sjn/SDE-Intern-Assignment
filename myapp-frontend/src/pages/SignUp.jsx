import { Link } from 'react-router-dom'

function SignUp() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <h1 className="display-5 fw-bold text-dark mb-4">Sign Up</h1>
      <p className="text-muted">Sign Up page coming soon!</p>
      <Link to="/" className="btn btn-secondary mt-3">
        Back to Home
      </Link>
    </div>
  )
}

export default SignUp
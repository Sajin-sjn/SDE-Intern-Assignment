import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <h1 className="display-4 fw-bold text-dark mb-5">Welcome Home</h1>
      <div className="d-flex gap-3">
        <Link to="/signup" className="btn btn-primary btn-lg">
          Sign Up
        </Link>
        <Link to="/login" className="btn btn-success btn-lg">
          Login
        </Link>
      </div>
    </div>
  )
}

export default Home
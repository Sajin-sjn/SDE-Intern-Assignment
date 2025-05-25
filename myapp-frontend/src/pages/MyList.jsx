import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import 'bootstrap-icons/font/bootstrap-icons.css'

function MyList() {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('MyList rendering, user:', user)

  useEffect(() => {
    const fetchMyList = async () => {
      console.log('Fetching user\'s list...')
      setLoading(true)
      try {
        const response = await axios.get('http://localhost:8000/api/my-list/')
        console.log('Fetched user\'s list:', response.data)
        setVideos(response.data)
        setError('')
      } catch (err) {
        console.error('Error fetching user\'s list:', err.response?.data, err.response?.status)
        setError('Failed to load your list')
      }
      setLoading(false)
    }
    if (user) {
      fetchMyList()
    } else {
      setError('Please log in to view your list')
      setLoading(false)
    }
  }, [user])

  const handleRemoveFromList = async (videoId) => {
    console.log(`Removing video ${videoId} from list, user:`, user)
    try {
      await axios.delete(`http://localhost:8000/api/my-list/${videoId}/remove/`)
      setVideos(videos.filter((item) => item.video.id !== videoId))
      console.log(`Video ${videoId} removed from list`)
      setError('')
    } catch (err) {
      console.error('Error removing from list:', err.response?.data, err.response?.status)
      setError(err.response?.data?.error || 'Failed to remove video from list')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getVideoUrl = (videoFile) => {
    return videoFile.startsWith('http://') || videoFile.startsWith('https://')
      ? videoFile
      : `http://localhost:8000${videoFile}`
  }

  const handleVideoError = (event, videoTitle) => {
    console.error(`Failed to load video: ${videoTitle}`, event.target.error)
    setError(`Failed to load video: ${videoTitle}. Please check the file format or server configuration.`)
  }

  return (
    <div className="container py-5" style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 className="display-5 fw-bold text-dark mb-4">My List</h1>
      <p className="text-muted mb-5">View videos you have added to your list.</p>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : videos.length === 0 ? (
        <p className="text-muted">
          No videos in your list. Add some from the <Link to="/dashboard">Dashboard</Link>!
        </p>
      ) : (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {videos.map((item) => (
            <div key={item.id} className="col">
              <div className="card h-100 shadow-sm">
                <video
                  className="card-img-top"
                  style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                  controls
                  preload="metadata"
                  onError={(e) => handleVideoError(e, item.video.title)}
                >
                  <source src={getVideoUrl(item.video.video_file)} type="video/mp4" />
                  <source src={getVideoUrl(item.video.video_file)} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
                <div className="card-body">
                  <h5 className="card-title">
                    <Link to={`/video/${item.video.id}`} className="text-dark text-decoration-none">
                      {item.video.title}
                    </Link>
                  </h5>
                  <p className="card-text text-muted" style={{ fontSize: '0.9rem' }}>
                    {item.video.description.length > 100
                      ? `${item.video.description.substring(0, 100)}...`
                      : item.video.description || 'No description'}
                  </p>
                  <p className="card-text text-muted small mb-1">
                    Uploaded by: {item.video.uploaded_by}
                  </p>
                  <p className="card-text text-muted small mb-1">
                    {formatDate(item.video.created_at)}
                  </p>
                  <p className="card-text text-muted small mb-3">
                    Duration: {formatDuration(item.video.duration)}
                  </p>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleRemoveFromList(item.video.id)}
                    title="Remove from My List"
                  >
                    <i className="bi bi-bookmark-fill"></i> Remove from My List
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyList
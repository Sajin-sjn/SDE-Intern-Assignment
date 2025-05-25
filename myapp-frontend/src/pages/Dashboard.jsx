import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import 'bootstrap-icons/font/bootstrap-icons.css'

function Dashboard() {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('Dashboard rendering, user:', user)

  useEffect(() => {
    const fetchVideos = async () => {
      console.log('Fetching videos...')
      setLoading(true)
      try {
        const response = await axios.get('http://localhost:8000/api/videos/')
        console.log('Fetched videos:', response.data)
        setVideos(response.data)
        setError('')
      } catch (err) {
        console.error('Error fetching videos:', err.response?.data, err.response?.status)
        setError('Failed to load videos')
      }
      setLoading(false)
    }
    fetchVideos()
  }, [])

  const handleAddToList = async (videoId) => {
    console.log(`Adding video ${videoId} to list, user:`, user)
    console.log('Available video IDs:', videos.map(v => v.id))
    if (videos.find(v => v.id === videoId)?.is_in_user_list) {
      setError('Video is already in your list')
      return
    }
    try {
      console.log('Sending POST /api/my-list/ with payload:', { video_id: videoId })
      await axios.post('http://localhost:8000/api/my-list/', { video_id: videoId })
      setVideos(
        videos.map((video) =>
          video.id === videoId ? { ...video, is_in_user_list: true } : video
        )
      )
      console.log(`Video ${videoId} added to list`)
      setError('')
    } catch (err) {
      console.error('Error adding to list:', err.response?.data, err.response?.status)
      if (err.response?.data?.error?.non_field_errors) {
        setError('Video is already in your list')
      } else if (err.response?.data?.error?.video_id) {
        setError('Invalid video selected')
      } else if (err.response?.data?.error?.user) {
        setError('User authentication required')
      } else if (err.response?.status === 500) {
        setError('Server error: Please try again later')
      } else {
        setError(err.response?.data?.error || 'Failed to add video to list')
      }
    }
  }

  const handleRemoveFromList = async (videoId) => {
    console.log(`Removing video ${videoId} from list, user:`, user)
    try {
      await axios.delete(`http://localhost:8000/api/my-list/${videoId}/remove/`)
      setVideos(
        videos.map((video) =>
          video.id === videoId ? { ...video, is_in_user_list: false } : video
        )
      )
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
    // If video_file is already an absolute URL, use it; otherwise, prepend base URL
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
      <h1 className="display-5 fw-bold text-dark mb-4">Welcome, {user?.username || 'User'}!</h1>
      <p className="text-muted mb-5">Explore all videos uploaded by our admins.</p>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : videos.length === 0 ? (
        <p className="text-muted">No videos available.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {videos.map((video) => (
            <div key={video.id} className="col">
              <div className="card h-100 shadow-sm">
                <video
                  className="card-img-top"
                  style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                  controls
                  preload="metadata"
                  onError={(e) => handleVideoError(e, video.title)}
                >
                  <source src={getVideoUrl(video.video_file)} type="video/mp4" />
                  <source src={getVideoUrl(video.video_file)} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
                <div className="card-body">
                  <h5 className="card-title">
                    <Link to={`/video/${video.id}`} className="text-dark text-decoration-none">
                      {video.title}
                    </Link>
                  </h5>
                  <p className="card-text text-muted" style={{ fontSize: '0.9rem' }}>
                    {video.description.length > 100
                      ? `${video.description.substring(0, 100)}...`
                      : video.description || 'No description'}
                  </p>
                  <p className="card-text text-muted small mb-1">
                    Uploaded by: {video.uploaded_by}
                  </p>
                  <p className="card-text text-muted small mb-1">
                    {formatDate(video.created_at)}
                  </p>
                  <p className="card-text text-muted small mb-3">
                    Duration: {formatDuration(video.duration)}
                  </p>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() =>
                      video.is_in_user_list
                        ? handleRemoveFromList(video.id)
                        : handleAddToList(video.id)
                    }
                    title={video.is_in_user_list ? 'Remove from My List' : 'Add to My List'}
                  >
                    <i
                      className={`bi ${video.is_in_user_list ? 'bi-bookmark-fill' : 'bi-bookmark'}`}
                    ></i>{' '}
                    {video.is_in_user_list ? 'Remove from My List' : 'Add to My List'}
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

export default Dashboard
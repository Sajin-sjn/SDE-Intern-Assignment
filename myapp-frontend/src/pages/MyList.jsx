import { useState, useEffect, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import 'bootstrap-icons/font/bootstrap-icons.css'

function MyList() {
  const { user } = useContext(AuthContext)
  const [videos, setVideos] = useState([])
  const [progressData, setProgressData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const playbackData = useRef({})

  // Fetch My List and Progress
  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching user\'s list and progress...')
      setLoading(true)
      try {
        const [listResponse, progressResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/my-list/'),
          axios.get('http://localhost:8000/api/progress/')
        ])
        console.log('Fetched list:', listResponse.data)
        console.log('Fetched progress:', progressResponse.data)
        setVideos(listResponse.data)
        const progressMap = {}
        progressResponse.data.forEach((prog) => {
          progressMap[prog.video.id] = {
            progress: prog.progress,
            last_watched_position: prog.last_watched_position,
            intervals: prog.intervals.map((i) => [i.start_time, i.end_time])
          }
        })
        setProgressData(progressMap)
        setError('')
      } catch (err) {
        console.error('Error fetching data:', err.response?.data, err.response?.status)
        setError('Failed to load your list or progress')
      }
      setLoading(false)
    }
    if (user) {
      fetchData()
    } else {
      setError('Please log in to view your list')
      setLoading(false)
    }
  }, [user])

  // Initialize playback data
  useEffect(() => {
    videos.forEach((item) => {
      const videoId = item.video.id
      if (!playbackData.current[videoId]) {
        playbackData.current[videoId] = {
          isPlaying: false,
          startTime: null,
          pendingIntervals: [],
          lastSavedTime: 0,
          videoElement: null
        }
      }
    })
  }, [videos])

  // Handle Remove from List
  const handleRemoveFromList = async (videoId) => {
    console.log(`Removing video ${videoId}`)
    try {
      await axios.delete(`http://localhost:8000/api/my-list/${videoId}/remove/`)
      setVideos(videos.filter((item) => item.video.id !== videoId))
      setError('')
    } catch (err) {
      console.error('Error removing:', err.response?.data, err.response?.status)
      setError(err.response?.data?.error || 'Failed to remove video')
    }
  }

  // Merge intervals
  const mergeIntervals = (intervals) => {
    if (!intervals.length) return []
    const sorted = intervals.sort((a, b) => a[0] - b[0])
    const merged = [[sorted[0][0], sorted[0][1]]]
    for (let i = 1; i < sorted.length; i++) {
      const [start, end] = sorted[i]
      const lastMerged = merged[merged.length - 1]
      if (start <= lastMerged[1]) {
        lastMerged[1] = Math.max(lastMerged[1], end)
      } else {
        merged.push([start, end])
      }
    }
    return merged
  }

  // Get non-overlapping intervals
  const getNewIntervals = (pendingIntervals, existingIntervals, duration) => {
    if (!pendingIntervals.length) return []
    // Round and merge pending intervals
    const roundedPending = pendingIntervals.map(([start, end]) => [
      Math.max(0, Math.round(start * 10) / 10),
      Math.min(duration, Math.round(end * 10) / 10)
    ]).filter(([s, e]) => s < e)
    const mergedPending = mergeIntervals(roundedPending)
    
    const newIntervals = []
    for (let [start, end] of mergedPending) {
      let overlap = false
      for (const [existStart, existEnd] of existingIntervals) {
        // Check for any overlap
        if (!(end <= existStart || start >= existEnd)) {
          overlap = true
          // Keep only non-overlapping segments
          if (start < existStart) {
            newIntervals.push([start, Math.min(end, existStart)])
          }
          if (end > existEnd) {
            newIntervals.push([Math.max(start, existEnd), end])
          }
        }
      }
      if (!overlap) {
        newIntervals.push([start, end])
      }
    }
    return mergeIntervals(newIntervals.filter(([s, e]) => s < e))
  }

  // Video event handlers
  const handlePlay = (videoId, videoElement) => {
    console.log(`Video ${videoId} playing`)
    const data = playbackData.current[videoId]
    data.isPlaying = true
    data.startTime = videoElement.currentTime
    data.videoElement = videoElement
    if (progressData[videoId]?.last_watched_position && videoElement.currentTime === 0) {
      videoElement.currentTime = progressData[videoId].last_watched_position
    }
  }

  const handlePause = (videoId, videoElement) => {
    console.log(`Video ${videoId} paused`)
    const data = playbackData.current[videoId]
    if (data.isPlaying && data.startTime !== null) {
      const endTime = videoElement.currentTime
      if (endTime > data.startTime) {
        data.pendingIntervals.push([data.startTime, endTime])
        saveProgress(videoId)
      }
    }
    data.isPlaying = false
    data.startTime = null
  }

  const handleTimeUpdate = (videoId, videoElement) => {
    const data = playbackData.current[videoId]
    const now = videoElement.currentTime
    if (data.isPlaying && now - data.lastSavedTime >= 15) {
      if (data.startTime !== null && now > data.startTime) {
        data.pendingIntervals.push([data.startTime, now])
        saveProgress(videoId)
      }
      data.startTime = now
      data.lastSavedTime = now
    }
  }

  const handleSeeking = (videoId, videoElement) => {
    console.log(`Video ${videoId} seeking to ${videoElement.currentTime}`)
    const data = playbackData.current[videoId]
    if (data.isPlaying && data.startTime !== null) {
      const endTime = videoElement.currentTime
      if (endTime > data.startTime) {
        data.pendingIntervals.push([data.startTime, endTime])
        saveProgress(videoId)
      }
    }
    data.startTime = videoElement.currentTime
    data.lastSavedTime = videoElement.currentTime
  }

  // Save progress
  const saveProgress = async (videoId) => {
    const data = playbackData.current[videoId]
    if (!data.pendingIntervals.length) return

    const video = videos.find((item) => item.video.id === videoId)
    if (!video) return

    const existingIntervals = progressData[videoId]?.intervals || []
    const newIntervals = getNewIntervals(data.pendingIntervals, existingIntervals, video.video.duration)

    if (!newIntervals.length) {
      console.log(`No new intervals for video ${videoId}`)
      data.pendingIntervals = []
      return
    }

    console.log(`Saving progress for video ${videoId}`, { newIntervals, pending: data.pendingIntervals, existing: existingIntervals })
    try {
      const response = await axios.post('http://localhost:8000/api/progress/update_progress/', {
        video_id: videoId,
        current_time: data.videoElement.currentTime,
        intervals: newIntervals.map(([start, end]) => ({
          start_time: start,
          end_time: end
        }))
      })
      console.log(`Progress saved for video ${videoId}:`, response.data)
      setProgressData((prev) => ({
        ...prev,
        [videoId]: {
          progress: response.data.progress,
          last_watched_position: response.data.last_watched_position,
          intervals: response.data.intervals.map((i) => [i.start_time, i.end_time])
        }
      }))
      data.pendingIntervals = []
      setError('')
    } catch (err) {
      console.error('Error saving progress:', err.response?.data, err.response?.status)
      const errorMsg = err.response?.data?.error?.includes('overlap')
        ? 'Rewatched segment not counted.'
        : 'Failed to save progress. Please try again.'
      setError(errorMsg)
    }
  }

  // Formatters
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
    setError(`Failed to load video: ${videoTitle}. Check file format or server.`)
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
          {videos.map((item) => {
            const videoId = item.video.id
            const progress = progressData[videoId] || { progress: 0, last_watched_position: 0 }
            return (
              <div key={item.id} className="col">
                <div className="card h-100 shadow-sm">
                  <video
                    className="card-img-top"
                    style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                    controls
                    preload="metadata"
                    onPlay={(e) => handlePlay(videoId, e.target)}
                    onPause={(e) => handlePause(videoId, e.target)}
                    onTimeUpdate={(e) => handleTimeUpdate(videoId, e.target)}
                    onSeeking={(e) => handleSeeking(videoId, e.target)}
                    onError={(e) => handleVideoError(e, item.video.title)}
                  >
                    <source src={getVideoUrl(item.video.video_file)} type="video/mp4" />
                    <source src={getVideoUrl(item.video.video_file)} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="card-body">
                    <h5 className="card-title">
                      <Link to={`/video/${videoId}`} className="text-dark text-decoration-none">
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
                    <p className="card-text text-muted small mb-1">
                      Duration: {formatDuration(item.video.duration)}
                    </p>
                    <p className="card-text text-muted small mb-2">
                      Last watched: {formatDuration(progress.last_watched_position)}
                    </p>
                    <div className="progress mb-3" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${progress.progress}%` }}
                        aria-valuenow={progress.progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <p className="card-text text-muted small mb-3">
                      Progress: {progress.progress.toFixed(1)}%
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleRemoveFromList(videoId)}
                      title="Remove from My List"
                    >
                      <i className="bi bi-bookmark-fill"></i> Remove from My List
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyList
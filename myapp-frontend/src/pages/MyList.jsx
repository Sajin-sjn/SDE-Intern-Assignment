import { useState, useEffect, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import 'bootstrap-icons/font/bootstrap-icons.css'
import api from '../api/axios'

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
          api.get('/api/my-list/'),
          api.get('/api/progress/')
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
          videoElement: null,
          lastSavedPosition: 0
        }
      }
    })
  }, [videos])

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      Object.keys(playbackData.current).forEach((videoId) => {
        const data = playbackData.current[videoId]
        if (data.videoElement && data.lastSavedPosition > 0) {
          saveProgress(videoId, data.lastSavedPosition)
        }
      })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Save progress for all videos on component unmount
      Object.keys(playbackData.current).forEach((videoId) => {
        const data = playbackData.current[videoId]
        if (data.videoElement && data.lastSavedPosition > 0) {
          saveProgress(videoId, data.lastSavedPosition)
        }
      })
    }
  }, [])

  // Handle Remove from List
  const handleRemoveFromList = async (videoId) => {
    console.log(`Removing video ${videoId}`)
    try {
      await api.delete(`/api/my-list/${videoId}/remove/`)
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
    const roundedPending = pendingIntervals
      .map(([start, end]) => [
        Math.max(0, Math.round(start * 10) / 10),
        Math.min(duration, Math.round(end * 10) / 10)
      ])
      .filter(([s, e]) => s < e)
    const mergedPending = mergeIntervals(roundedPending)
    const newIntervals = []
    for (let [start, end] of mergedPending) {
      let overlap = false
      for (const [existStart, existEnd] of existingIntervals) {
        if (!(end <= existStart || start >= existEnd)) {
          overlap = true
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
  }

  const handleLoadedMetadata = (videoId, videoElement) => {
    console.log(`Video ${videoId} metadata loaded`)
    const data = playbackData.current[videoId]
    const lastPosition = progressData[videoId]?.last_watched_position || 0
    const duration = videoElement.duration
    if (lastPosition > 0 && lastPosition < duration && videoElement.currentTime === 0) {
      console.log(`Resuming video ${videoId} at ${lastPosition}s`)
      videoElement.currentTime = lastPosition
      data.lastSavedPosition = lastPosition
    }
  }

  const handlePause = (videoId, videoElement) => {
    console.log(`Video ${videoId} paused at ${videoElement.currentTime}s`)
    const data = playbackData.current[videoId]
    if (data.isPlaying && data.startTime !== null) {
      const endTime = videoElement.currentTime
      if (endTime > data.startTime) {
        data.pendingIntervals.push([data.startTime, endTime])
      }
    }
    data.isPlaying = false
    data.startTime = null
    data.lastSavedPosition = videoElement.currentTime
    saveProgress(videoId, videoElement.currentTime)
  }

  const handleTimeUpdate = (videoId, videoElement) => {
    const data = playbackData.current[videoId]
    const now = videoElement.currentTime
    data.lastSavedPosition = now
    if (data.isPlaying && now - data.lastSavedTime >= 15) {
      if (data.startTime !== null && now > data.startTime) {
        data.pendingIntervals.push([data.startTime, now])
        saveProgress(videoId, now)
      }
      data.startTime = now
      data.lastSavedTime = now
    }
  }

  const handleSeeking = (videoId, videoElement) => {
    console.log(`Video ${videoId} seeking to ${videoElement.currentTime}s`)
    const data = playbackData.current[videoId]
    if (data.isPlaying && data.startTime !== null) {
      const endTime = videoElement.currentTime
      if (endTime > data.startTime) {
        data.pendingIntervals.push([data.startTime, endTime])
      }
    }
    data.startTime = videoElement.currentTime
    data.lastSavedTime = videoElement.currentTime
    data.lastSavedPosition = videoElement.currentTime
    saveProgress(videoId, videoElement.currentTime)
  }

  // Save progress
  const saveProgress = async (videoId, currentTime) => {
    const data = playbackData.current[videoId]
    if (!data.videoElement) return

    const video = videos.find((item) => item.video.id === videoId)
    if (!video) return

    const existingIntervals = progressData[videoId]?.intervals || []
    const newIntervals = getNewIntervals(data.pendingIntervals, existingIntervals, video.video.duration)

    console.log(`Saving progress for video ${videoId}`, {
      currentTime,
      newIntervals,
      pending: data.pendingIntervals,
      existing: existingIntervals
    })
    try {
      const response = await api.post('/api/progress/update_progress/', {
        video_id: videoId,
        current_time: currentTime,
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
      : `https://myapp-backend-4m41.onrender.com${videoFile}`
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
                    onLoadedMetadata={(e) => handleLoadedMetadata(videoId, e.target)}
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
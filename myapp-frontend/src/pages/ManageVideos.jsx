import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

function ManageVideos() {
  const { user } = useContext(AuthContext);
  console.log('[ManageVideos] Rendering, user:', user, 'path:', window.location.pathname);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_file: null,
    duration: '',
  });
  const [videos, setVideos] = useState([]);
  const [editVideo, setEditVideo] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[ManageVideos] Fetching videos...');
    setLoading(true);
    const source = axios.CancelToken.source();

    api
      .get('/api/videos/', { cancelToken: source.token })
      .then((response) => {
        console.log('[ManageVideos] Fetched videos:', response.data);
        setVideos(response.data);
        setError(''); // Clear any previous error
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          console.log('[ManageVideos] Fetch cancelled');
        } else {
          console.error('[ManageVideos] Error fetching videos:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          setError('Failed to load videos');
          setLoading(false);
        }
      });

    return () => {
      console.log('[ManageVideos] Cancelling fetch on unmount');
      source.cancel('Component unmounted');
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.duration || (!formData.video_file && !editVideo)) {
      setError('Title, duration, and video file are required');
      return;
    }
    setLoading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description || '');
    if (formData.video_file) {
      data.append('video_file', formData.video_file);
    }
    data.append('duration', parseFloat(formData.duration));

    try {
      if (editVideo) {
        const response = await api.patch(`/api/videos/${editVideo.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setVideos(videos.map((v) => (v.id === editVideo.id ? response.data : v)));
        setSuccessMessage('Video updated successfully');
        setEditVideo(null);
      } else {
        const response = await api.post('/api/videos/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setVideos([...videos, response.data]);
        setSuccessMessage('Video added successfully');
      }
      setFormData({ title: '', description: '', video_file: null, duration: '' });
      setError('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('[ManageVideos] Error saving video:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to save video');
    }
    setLoading(false);
  };

  const handleEdit = (video) => {
    setEditVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      video_file: null,
      duration: video.duration.toString(),
    });
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    setLoading(true);
    try {
      await api.delete(`/api/videos/${id}/`);
      setVideos(videos.filter((v) => v.id !== id));
      setSuccessMessage('Video deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('[ManageVideos] Error deleting video:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to delete video');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container py-5" style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 className="display-5 fw-bold text-dark mb-4">Manage Videos</h1>
      <p className="text-muted mb-5">Welcome, {user?.username || 'Admin'}! Manage your video content.</p>

      <div className="card p-4 shadow mb-5">
        <h3 className="mb-4">{editVideo ? 'Update Video' : 'Add New Video'}</h3>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              disabled={loading}
            ></textarea>
          </div>
          <div className="mb-3">
            <label htmlFor="video_file" className="form-label">
              {editVideo ? 'Replace Video File (optional)' : 'Video File'}
            </label>
            <input
              type="file"
              className="form-control"
              id="video_file"
              name="video_file"
              accept="video/*"
              onChange={handleChange}
              required={!editVideo}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="duration" className="form-label">Duration (seconds)</label>
            <input
              type="number"
              className="form-control"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="0"
              step="0.1"
              required
              disabled={loading}
            />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : editVideo ? (
                'Update Video'
              ) : (
                'Add Video'
              )}
            </button>
            {editVideo && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditVideo(null);
                  setFormData({ title: '', description: '', video_file: null, duration: '' });
                  setError('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card p-4 shadow">
        <h3 className="mb-4">Existing Videos</h3>
        {loading ? (
          <div className="text-center">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span className="ms-2">Loading videos...</span>
          </div>
        ) : videos.length === 0 ? (
          <p className="text-muted">No videos available.</p>
        ) : (
          <ul className="list-group">
            {videos.map((video) => (
              <li key={video.id} className="list-group-item d-flex justify-content-between align-items-start">
                <div>
                  <h5>{video.title}</h5>
                  <p>{video.description || 'No description'}</p>
                  <p className="text-muted mb-1">Uploaded by: {video.uploaded_by}</p>
                  <p className="text-muted mb-1">Created: {formatDate(video.created_at)}</p>
                  <p className="text-muted mb-1">Duration: {formatDuration(video.duration)}</p>
                  <a href={video.video_file} target="_blank" rel="noopener noreferrer" className="text-primary">
                    Watch Video
                  </a>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleEdit(video)}
                    disabled={loading}
                  >
                    Update
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(video.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ManageVideos;
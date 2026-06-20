import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import './MySubmissions.css'

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ outcome: '', from: '', to: '' })

  const loadSubmissions = async () => {
    setLoading(true)
    setError('')

    const params = {}
    if (filters.outcome) params.outcome = filters.outcome
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to

    try {
      const { data } = await api.get('/submissions/', { params })
      setSubmissions(data)
    } catch (err) {
      setError('Failed to load submissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = (e) => {
    e.preventDefault()
    loadSubmissions()
  }

  const handleClear = () => {
    setFilters({ outcome: '', from: '', to: '' })
    setTimeout(loadSubmissions, 0)
  }

  const formatDate = (iso) => new Date(iso).toLocaleString()

  return (
    <div className="page-container submissions-page">
      <h1>My Submissions</h1>

      <form className="filter-bar" onSubmit={handleApply}>
        <div className="form-group">
          <label>Outcome</label>
          <select
            value={filters.outcome}
            onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
          >
            <option value="">All Outcomes</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        <div className="form-group">
          <label>From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Apply Filters
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          Clear
        </button>
      </form>

      {loading && <div className="loading">Loading submissions...</div>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && submissions.length === 0 && (
        <div className="empty-state">
          <p>No submissions found.</p>
        </div>
      )}

      {!loading &&
        submissions.map((sub) => {
          const detectedCategories = (img) =>
            img.categories
              .filter((c) => c.detected)
              .map((c) => c.category.replace(/_/g, ' '))
              .join(', ')

          return (
            <div key={sub.id} className="submission-card">
              <div className="submission-meta">
                Submission #{sub.id} &mdash; {formatDate(sub.created_at)}
              </div>
              {sub.images.map((img, idx) => (
                <div key={img.id} className="image-row">
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    Image {idx + 1}
                  </span>
                  <span className={`badge badge-${img.outcome}`}>{img.outcome}</span>
                  <span className="detected-cats">
                    {detectedCategories(img)
                      ? `Detected: ${detectedCategories(img)}`
                      : 'No violations detected'}
                  </span>
                  {img.appeal && (
                    <span className={`badge badge-${img.appeal.status}`}>
                      Appeal: {img.appeal.status}
                    </span>
                  )}
                  {(img.outcome === 'flagged' || img.outcome === 'blocked') &&
                    !img.appeal && (
                      <Link to={`/appeal/${img.id}`} className="appeal-link">
                        File Appeal
                      </Link>
                    )}
                </div>
              ))}
            </div>
          )
        })}
    </div>
  )
}

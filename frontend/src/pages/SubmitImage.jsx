import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import './SubmitImage.css'

export default function SubmitImage() {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map((f) => ({ url: URL.createObjectURL(f), name: f.name })))
    setResults(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length) return

    setLoading(true)
    setError('')
    setResults(null)

    const formData = new FormData()
    files.forEach((f) => formData.append('images', f))

    try {
      const { data } = await api.post('/submissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResults(data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Submission failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getOutcomeColor = (outcome) => {
    if (outcome === 'approved') return '#16a34a'
    if (outcome === 'flagged') return '#ca8a04'
    if (outcome === 'blocked') return '#dc2626'
    return '#ccc'
  }

  return (
    <div className="page-container submit-page">
      <div className="upload-area">
        <h1>Submit Images for Moderation</h1>
        <form onSubmit={handleSubmit}>
          <div className="file-input">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          {previews.length > 0 && (
            <div className="preview-grid">
              {previews.map((p, i) => (
                <div key={i} className="preview-item">
                  <img src={p.url} alt={p.name} />
                  <p>{p.name}</p>
                </div>
              ))}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!files.length || loading}
          >
            {loading ? 'Analyzing...' : 'Submit for Moderation'}
          </button>
        </form>
        {loading && (
          <p className="loading-text">Analyzing images with AI...</p>
        )}
        {error && <p className="error-msg" style={{ marginTop: '12px' }}>{error}</p>}
      </div>

      {results && (
        <div>
          <h2 style={{ marginBottom: '16px', color: '#1e1b4b', fontSize: '20px', fontWeight: '700' }}>
            Moderation Results
          </h2>
          {results.images.map((img, idx) => (
            <div
              key={img.id}
              className={`result-card ${img.outcome}`}
              style={{ borderLeftColor: getOutcomeColor(img.outcome) }}
            >
              <div className="result-header">
                <span style={{ fontWeight: '600', fontSize: '15px', color: '#1e1b4b' }}>
                  Image {idx + 1}
                </span>
                <span className={`badge badge-${img.outcome}`}>{img.outcome}</span>
              </div>
              {img.categories && img.categories.length > 0 && (
                <table className="category-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Detected</th>
                      <th>Confidence</th>
                      <th>Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {img.categories.map((cat, ci) => (
                      <tr key={ci}>
                        <td style={{ fontWeight: '500', textTransform: 'capitalize' }}>
                          {cat.category.replace(/_/g, ' ')}
                        </td>
                        <td className={cat.detected ? 'detected-yes' : 'detected-no'}>
                          {cat.detected ? 'Yes' : 'No'}
                        </td>
                        <td>{cat.confidence.toFixed(1)}%</td>
                        <td style={{ color: '#6b7280', fontSize: '12px' }}>{cat.reasoning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(img.outcome === 'flagged' || img.outcome === 'blocked') && (
                <div style={{ marginTop: '14px' }}>
                  <Link
                    to={`/appeal/${img.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '8px 16px', display: 'inline-block', textDecoration: 'none' }}
                  >
                    File an Appeal
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

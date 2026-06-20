import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import './AppealPage.css'

export default function AppealPage() {
  const { imageId } = useParams()
  const navigate = useNavigate()

  const [justification, setJustification] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (justification.trim().length < 20) {
      setError('Justification must be at least 20 characters.')
      return
    }

    setLoading(true)
    try {
      await api.post('/appeals/', {
        image_result_id: imageId,
        justification: justification.trim(),
      })
      setSuccess('Appeal submitted successfully! Redirecting...')
      setTimeout(() => navigate('/submissions'), 2000)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to submit appeal. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="appeal-page">
      <Link to="/submissions" className="back-link">
        ← Back to My Submissions
      </Link>
      <h1>File an Appeal</h1>
      <div className="info-box">
        Appeals are reviewed by our moderation team. Provide a detailed explanation
        of why you believe this content should be approved. Appeals are typically
        reviewed within 24 hours.
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="justification">
            Justification
          </label>
          <textarea
            id="justification"
            rows={6}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain why this content should be approved (minimum 20 characters)..."
          />
          <p className="char-count">{justification.length} characters</p>
        </div>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Appeal'}
        </button>
      </form>
    </div>
  )
}

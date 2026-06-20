import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import './AdminQueue.css'

export default function AdminQueue() {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState({})

  const loadAppeals = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/appeals/queue/')
      setAppeals(data)
    } catch (err) {
      console.error('Failed to load appeals', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppeals()
  }, [])

  const handleReview = async (id, newStatus) => {
    try {
      await api.patch(`/appeals/${id}/`, {
        status: newStatus,
        admin_response: responses[id] || '',
      })
      loadAppeals()
    } catch (err) {
      console.error('Failed to review appeal', err)
    }
  }

  const handleResponseChange = (id, value) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }

  const formatDate = (iso) => new Date(iso).toLocaleString()

  return (
    <div className="page-container queue-page">
      <h1>Appeal Queue</h1>
      <p className="subtitle">Review and respond to pending content appeals</p>

      {loading && <div className="loading">Loading appeals...</div>}

      {!loading && appeals.length === 0 && (
        <div className="empty-state">
          <p>No pending appeals</p>
        </div>
      )}

      {!loading &&
        appeals.map((appeal) => (
          <div key={appeal.id} className="appeal-card">
            <div className="appeal-card-header">
              <div className="user-info">
                <strong>
                  {appeal.user_details?.username || `User #${appeal.user}`}
                </strong>
                <span>{appeal.user_details?.email || ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className={`badge badge-${appeal.image_result_outcome || 'flagged'}`}
                  style={{ fontSize: '12px' }}
                >
                  {appeal.image_result_outcome || 'flagged'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Filed {formatDate(appeal.created_at)}
                </span>
              </div>
            </div>

            <div className="justification-box">{appeal.justification}</div>

            <div className="response-area">
              <label htmlFor={`response-${appeal.id}`}>
                Admin Response (optional)
              </label>
              <textarea
                id={`response-${appeal.id}`}
                rows={3}
                placeholder="Add a response for the user..."
                value={responses[appeal.id] || ''}
                onChange={(e) => handleResponseChange(appeal.id, e.target.value)}
              />
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-success"
                onClick={() => handleReview(appeal.id, 'accepted')}
              >
                Accept Appeal
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleReview(appeal.id, 'rejected')}
              >
                Reject Appeal
              </button>
            </div>
          </div>
        ))}
    </div>
  )
}

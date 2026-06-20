import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import './AdminPolicies.css'

function toTitleCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

export default function AdminPolicies() {
  const [policies, setPolicies] = useState([])
  const [saving, setSaving] = useState({})
  const [messages, setMessages] = useState({})

  useEffect(() => {
    api.get('/policies/').then(({ data }) => setPolicies(data))
  }, [])

  const updatePolicy = (category, field, value) => {
    setPolicies((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [field]: value } : p))
    )
  }

  const savePolicy = async (category) => {
    const policy = policies.find((p) => p.category === category)
    if (!policy) return

    setSaving((prev) => ({ ...prev, [category]: true }))
    try {
      await api.patch(`/policies/${category}/`, {
        enabled: policy.enabled,
        confidence_threshold: policy.confidence_threshold,
        enforcement: policy.enforcement,
      })
      setMessages((prev) => ({ ...prev, [category]: 'Saved!' }))
      setTimeout(
        () => setMessages((prev) => ({ ...prev, [category]: '' })),
        2000
      )
    } catch {
      setMessages((prev) => ({ ...prev, [category]: 'Error saving' }))
    } finally {
      setSaving((prev) => ({ ...prev, [category]: false }))
    }
  }

  return (
    <div className="page-container policies-page">
      <h1>Content Policies</h1>
      <p className="subtitle">Configure moderation rules for each content category</p>

      <div className="policies-grid">
        {policies.map((policy) => (
          <div key={policy.category} className="policy-card">
            <h3>{toTitleCase(policy.category)}</h3>

            <div className="toggle-row">
              <span className="toggle-label">Enabled</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(e) =>
                    updatePolicy(policy.category, 'enabled', e.target.checked)
                  }
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="threshold-row">
              <label htmlFor={`threshold-${policy.category}`}>
                Confidence Threshold
              </label>
              <input
                id={`threshold-${policy.category}`}
                type="number"
                min="0"
                max="100"
                value={policy.confidence_threshold}
                onChange={(e) =>
                  updatePolicy(
                    policy.category,
                    'confidence_threshold',
                    parseFloat(e.target.value)
                  )
                }
              />
              <span>%</span>
            </div>

            <div className="enforcement-row">
              <label htmlFor={`enforcement-${policy.category}`}>
                Enforcement
              </label>
              <select
                id={`enforcement-${policy.category}`}
                value={policy.enforcement}
                onChange={(e) =>
                  updatePolicy(policy.category, 'enforcement', e.target.value)
                }
              >
                <option value="auto_block">Auto-Block</option>
                <option value="flag_review">Flag for Review</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => savePolicy(policy.category)}
                disabled={saving[policy.category]}
              >
                {saving[policy.category] ? 'Saving...' : 'Save'}
              </button>
              {messages[policy.category] && (
                <span
                  className={`save-feedback ${
                    messages[policy.category] === 'Error saving' ? 'error' : ''
                  }`}
                >
                  {messages[policy.category]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

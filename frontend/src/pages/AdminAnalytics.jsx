import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import api from '../api/axios'
import './AdminAnalytics.css'

const OUTCOME_COLORS = {
  approved: '#16a34a',
  flagged: '#ca8a04',
  blocked: '#dc2626',
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/analytics/')
      .then(({ data: d }) => setData(d))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading analytics...</div>
  if (error) return <p className="error-msg" style={{ padding: '32px' }}>{error}</p>

  const totalAppeals = data.appeal_stats.reduce((s, a) => s + a.count, 0)
  const getAppealCount = (status) =>
    data.appeal_stats.find((a) => a.status === status)?.count || 0
  const pending = getAppealCount('pending')
  const accepted = getAppealCount('accepted')
  const rejected = getAppealCount('rejected')
  const resolutionRate =
    totalAppeals > 0
      ? (((accepted + rejected) / totalAppeals) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="page-container analytics-page">
      <h1>Analytics Dashboard</h1>
      <p className="subtitle">Platform-wide moderation metrics and insights</p>

      {/* Section 1: Submission Volume */}
      <div className="analytics-section">
        <h2>Submission Volume Over Time</h2>
        {data.submission_volume.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.submission_volume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 2: Verdict by Outcome */}
      <div className="analytics-section">
        <h2>Verdict Distribution</h2>
        {data.verdict_by_outcome.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.verdict_by_outcome}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="outcome" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count">
                {data.verdict_by_outcome.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={OUTCOME_COLORS[entry.outcome] || '#4f46e5'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 3: Detections by Category */}
      <div className="analytics-section">
        <h2>Detections by Category</h2>
        {data.verdict_by_category.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No violations detected yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={data.verdict_by_category}
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fontSize: 11 }}
                width={160}
                tickFormatter={(val) =>
                  val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                }
              />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 4: Appeal Stats */}
      <div className="analytics-section">
        <h2>Appeal Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalAppeals}</div>
            <div className="stat-label">Total Appeals</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{accepted}</div>
            <div className="stat-label">Accepted</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
          Resolution rate: <strong style={{ color: '#4f46e5' }}>{resolutionRate}%</strong>
        </p>
      </div>

      {/* Section 5: Top Users by Submissions */}
      <div className="analytics-section">
        <h2>Top Users by Submissions</h2>
        {data.top_by_submissions.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No data available yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Submissions</th>
              </tr>
            </thead>
            <tbody>
              {data.top_by_submissions.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row['user__username'] || 'Unknown'}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Section 6: Top Users by Violations */}
      <div className="analytics-section">
        <h2>Top Users by Violations</h2>
        {data.top_by_violations.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No violations recorded yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Violations (Flagged + Blocked)</th>
              </tr>
            </thead>
            <tbody>
              {data.top_by_violations.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row['submission__user__username'] || 'Unknown'}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ModerateAI
      </Link>
      <div className="navbar-links">
        <Link to="/submit">Submit Image</Link>
        <Link to="/submissions">My Submissions</Link>
        {auth.role === 'admin' && (
          <>
            <Link to="/admin/queue">Appeal Queue</Link>
            <Link to="/admin/policies">Policies</Link>
            <Link to="/admin/analytics">Analytics</Link>
          </>
        )}
        <span className="navbar-user">{auth.username}</span>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [role, setRole] = useState(() => localStorage.getItem('role') || null)
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null)

  const login = (newToken, newRole, newUsername) => {
    setToken(newToken)
    setRole(newRole)
    setUsername(newUsername)
    localStorage.setItem('token', newToken)
    localStorage.setItem('role', newRole)
    localStorage.setItem('username', newUsername)
  }

  const logout = () => {
    setToken(null)
    setRole(null)
    setUsername(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
  }

  return (
    <AuthContext.Provider value={{ token, role, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

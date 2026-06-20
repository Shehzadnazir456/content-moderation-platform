import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import SubmitImage from './pages/SubmitImage'
import MySubmissions from './pages/MySubmissions'
import AppealPage from './pages/AppealPage'
import AdminQueue from './pages/AdminQueue'
import AdminPolicies from './pages/AdminPolicies'
import AdminAnalytics from './pages/AdminAnalytics'

function AppRoutes() {
  const auth = useAuth()

  return (
    <>
      {auth.token && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={auth.token ? <Navigate to="/submit" replace /> : <Navigate to="/login" replace />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/submit"
          element={
            <PrivateRoute>
              <SubmitImage />
            </PrivateRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <PrivateRoute>
              <MySubmissions />
            </PrivateRoute>
          }
        />
        <Route
          path="/appeal/:imageId"
          element={
            <PrivateRoute>
              <AppealPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminRoute>
              <AdminQueue />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <AdminRoute>
              <AdminPolicies />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

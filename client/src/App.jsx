import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import StackView from './pages/StackView'
import Profile from './pages/Profile'
import NewStack from './pages/NewStack'
import NewClass from './pages/NewClass'
import ClassView from './pages/ClassView'
import LoginSignup from './pages/LoginSignup'
import './styles/index.css'

const isAuthenticated = () => {
  return Boolean(localStorage.getItem('stackd_mock_session'))
}

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to='/' replace />
  }

  return children
}

const App = () => {
  return (
    <Router>
      <div className='App'>
        <Routes>
          <Route path='/' element={<LoginSignup />} />
          <Route path='/login' element={<Navigate to='/' replace />} />
          <Route
            path='/home'
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/stack/:id'
            element={
              <ProtectedRoute>
                <StackView />
              </ProtectedRoute>
            }
          />
          <Route
            path='/stack/new'
            element={
              <ProtectedRoute>
                <NewStack />
              </ProtectedRoute>
            }
          />
          <Route
            path='/class/:id'
            element={
              <ProtectedRoute>
                <ClassView />
              </ProtectedRoute>
            }
          />
          <Route
            path='/class/new'
            element={
              <ProtectedRoute>
                <NewClass />
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

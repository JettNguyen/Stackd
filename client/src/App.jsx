import React, { useEffect, useRef, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CSSTransition, SwitchTransition } from 'react-transition-group'
import PageHeader from './components/PageHeader'
import Home from './pages/Home'
import StackView from './pages/StackView'
import Profile from './pages/Profile'
import NewStack from './pages/NewStack'
import NewClass from './pages/NewClass'
import ClassView from './pages/ClassView'
import LoginSignup from './pages/LoginSignup'
import './styles/index.css'
import { clearAuthToken, getAuthToken, restoreSessionFromToken } from './utils/api'

const isAuthenticated = () => {
  return Boolean(getAuthToken())
}

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to='/' replace />
  }

  return children
}

const GlobalHeader = () => {
  const location = useLocation()
  const currentPath = location.pathname

  if (currentPath === '/' || currentPath === '/login') {
    return null
  }

  const isHome = currentPath === '/home'

  return (
    <PageHeader
      showBack={!isHome}  // now Profile page has back button
      showProfile={isHome || currentPath.startsWith('/stack') || currentPath.startsWith('/class')}
    />
  )
}

const AnimatedRoutes = () => {
  const location = useLocation()
  const nodeRef = useRef(null)

  return (
    <SwitchTransition mode='out-in'>
      <CSSTransition
        nodeRef={nodeRef}
        key={location.pathname}
        classNames='route'
        timeout={420}
        unmountOnExit
        appear
      >
        <div ref={nodeRef} className='route-animation-shell'>
          <Routes location={location}>
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
              path='/profile/:username'
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path='/stack/:id' element={<StackView />} />
            <Route
              path='/stack/new'
              element={
                <ProtectedRoute>
                  <NewStack />
                </ProtectedRoute>
              }
            />
            <Route path='/class/:id' element={<ClassView />} />
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
      </CSSTransition>
    </SwitchTransition>
  )
}

const App = () => {
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState(true)

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      const token = getAuthToken()

      if (!token) {
        if (isMounted) {
          setIsBootstrappingAuth(false)
        }
        return
      }

      try {
        await restoreSessionFromToken()
      } catch {
        clearAuthToken()
      } finally {
        if (isMounted) {
          setIsBootstrappingAuth(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      isMounted = false
    }
  }, [])

  if (isBootstrappingAuth) {
    return null
  }

  return (
    <Router>
      <div className='App'>
        <GlobalHeader />
        <AnimatedRoutes />
      </div>
    </Router>
  )
}

export default App

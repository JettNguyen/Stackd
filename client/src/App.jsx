import React, { useEffect, useRef, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
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

const ScrollManager = () => {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    return () => {
      sessionStorage.setItem(`scroll:${location.key}`, String(window.scrollY))
    }
  }, [location.key])

  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${location.key}`)
      if (saved) {
        const t = setTimeout(() => {
          window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' })
        }, 430)
        return () => clearTimeout(t)
      }
    }
    else {
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, 250)
      return () => clearTimeout(t)
    }
  }, [location.key, navigationType])

  return null
}

const GlobalHeader = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayPath, setDisplayPath] = useState(location.pathname)

  useEffect(() => {
    if (navigationType === 'POP') {
      const t = setTimeout(() => setDisplayPath(location.pathname), 260)
      return () => clearTimeout(t)
    } else {
      setDisplayPath(location.pathname)
    }
  }, [location.pathname, navigationType])

  if (displayPath === '/' || displayPath === '/login') {
    return null
  }

  const isHome = displayPath === '/home'

  return (
    <PageHeader
      showBack={!isHome}
      showProfile={isHome || displayPath.startsWith('/stack') || displayPath.startsWith('/class')}
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
      <ScrollManager />
      <div className='App'>
        <GlobalHeader />
        <AnimatedRoutes />
      </div>
    </Router>
  )
}

export default App

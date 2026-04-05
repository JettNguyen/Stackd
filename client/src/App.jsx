import React, { useCallback, useEffect, useRef, useState } from 'react'
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

const ScrollManager = ({ onScrollTargetChange }) => {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const previous = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'

      return () => {
        window.history.scrollRestoration = previous
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      sessionStorage.setItem(`scroll:${location.key}`, String(window.scrollY))
    }
  }, [location.key])

  useEffect(() => {
    let nextTop = 0

    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${location.key}`)
      if (saved !== null) {
        nextTop = parseInt(saved, 10) || 0
      }
    }

    onScrollTargetChange(nextTop)
  }, [location.key, navigationType, onScrollTargetChange])

  return null
}

const GlobalHeader = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayPath, setDisplayPath] = useState(location.pathname)

  useEffect(() => {
    const t = setTimeout(() => setDisplayPath(location.pathname), 260)
    return () => clearTimeout(t)
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

const AnimatedRoutes = ({ onRouteEnter }) => {
  const location = useLocation()
  const nodeRef = useRef(null)

  return (
    <SwitchTransition mode='out-in'>
      <CSSTransition
        nodeRef={nodeRef}
        key={location.pathname}
        classNames='route'
        timeout={{ enter: 320, exit: 260 }}
        onEnter={onRouteEnter}
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
  const pendingScrollTopRef = useRef(0)

  const handleScrollTargetChange = useCallback((nextTop) => {
    pendingScrollTopRef.current = nextTop
  }, [])

  const handleRouteEnter = useCallback(() => {
    window.scrollTo({ top: pendingScrollTopRef.current, behavior: 'instant' })
  }, [])

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
      <ScrollManager onScrollTargetChange={handleScrollTargetChange} />
      <div className='App'>
        <GlobalHeader />
        <AnimatedRoutes onRouteEnter={handleRouteEnter} />
      </div>
    </Router>
  )
}

export default App

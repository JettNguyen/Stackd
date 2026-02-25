import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import StackView from './pages/StackView'
import Profile from './pages/Profile'
import NewStack from './pages/NewStack'
import NewClass from './pages/NewClass'
import ClassView from './pages/ClassView'
import LoginSignup from './pages/LoginSignup'
import './styles/index.css'

const App = () => {
  return (
    <Router>
      <div className='App'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<LoginSignup />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/stack/:id' element={<StackView />} />
          <Route path='/stack/new' element={<NewStack />} />
          <Route path='/class/:id' element={<ClassView />} />
          <Route path='/class/new' element={<NewClass />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import VaccineManagement from './components/VaccineManagement'
import TemperatureLogs from './components/TemperatureLogs'
import UserManagement from './components/UserManagement'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/vaccines" element={<VaccineManagement />} />
          <Route path="/temperature-logs" element={<TemperatureLogs />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
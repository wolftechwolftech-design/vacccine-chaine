import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Vaccine Management System</h2>
      </div>
      <ul className="navbar-nav">
        <li><Link to="/vaccines">Vaccines</Link></li>
        <li><Link to="/temperature-logs">Temperature Logs</Link></li>
        <li><Link to="/users">Users</Link></li>
        <li><Link to="/">Logout</Link></li>
      </ul>
    </nav>
  )
}

export default Navbar
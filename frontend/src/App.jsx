import { useState } from 'react'
import Login from './pages/Login'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Payroll from './pages/Payroll'
import Contracts from './pages/Contracts'
import Recruitment from './pages/Recruitment'

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('token'))
  const [page, setPage] = useState('dashboard')

  if (!logged) return <Login onLogin={() => setLogged(true)} />

  const pages = {
    dashboard: <Dashboard />,
    employees: <Employees />,
    attendance: <Attendance />,
    leaves: <Leaves />,
    payroll: <Payroll />,
    contracts: <Contracts />,
    recruitment: <Recruitment />,
  }

  return <Shell page={page} setPage={setPage} onLogout={() => { localStorage.clear(); setLogged(false) }}>
    {pages[page] || <Dashboard />}
  </Shell>
}

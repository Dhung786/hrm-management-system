import { useEffect, useMemo, useState } from 'react'
import { request } from './api'
import Login from './pages/Login'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Organization from './pages/Organization'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Payroll from './pages/Payroll'
import Contracts from './pages/Contracts'
import Reviews from './pages/Reviews'
import Recruitment from './pages/Recruitment'
import Accounts from './pages/Accounts'
import Profile from './pages/Profile'
import System from './pages/System'

const access = {
  dashboard: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  employees: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  organization: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  attendance: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  leaves: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  payroll: ['ADMIN', 'PAYROLL', 'EMPLOYEE'],
  contracts: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  reviews: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  recruitment: ['ADMIN', 'HR'],
  accounts: ['ADMIN'],
  system: ['ADMIN'],
  profile: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
}

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('current_user') || 'null') } catch { return null }
  })
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    if (!logged) return
    request('/api/auth/me').then(me => {
      setUser(me)
      localStorage.setItem('role', me.role)
      localStorage.setItem('role_label', me.role_label)
      localStorage.setItem('current_user', JSON.stringify(me))
    }).catch(() => {
      localStorage.clear(); setLogged(false); setUser(null)
    })
  }, [logged])

  const pages = useMemo(() => ({
    dashboard: <Dashboard />,
    employees: <Employees />,
    organization: <Organization />,
    attendance: <Attendance />,
    leaves: <Leaves />,
    payroll: <Payroll />,
    contracts: <Contracts />,
    reviews: <Reviews />,
    recruitment: <Recruitment />,
    accounts: <Accounts />,
    system: <System />,
    profile: <Profile />,
  }), [])

  if (!logged) return <Login onLogin={me => { setUser(me); setLogged(true) }} />
  if (!user) return <div className="loading-screen">Đang tải thông tin tài khoản...</div>

  const allowedPages = Object.fromEntries(Object.entries(access).map(([key, roles]) => [key, roles.includes(user.role)]))
  const currentPage = allowedPages[page] ? page : 'dashboard'

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setPage('dashboard')
    setLogged(false)
  }

  return <Shell page={currentPage} setPage={setPage} onLogout={logout} user={user} allowedPages={allowedPages}>
    {pages[currentPage] || <Dashboard />}
  </Shell>
}

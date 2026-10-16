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
import AccessDenied from './pages/AccessDenied'

// Mỗi vai trò chỉ nhìn thấy đúng nhóm chức năng phục vụ công việc của mình.
// ADMIN vẫn có toàn quyền để quản trị, kiểm tra và hỗ trợ hệ thống.
const access = {
  dashboard: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  employees: ['ADMIN', 'HR', 'MANAGER'],
  organization: ['ADMIN', 'HR'],
  attendance: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
  leaves: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  payroll: ['ADMIN', 'PAYROLL', 'EMPLOYEE'],
  contracts: ['ADMIN', 'HR', 'PAYROLL', 'EMPLOYEE'],
  reviews: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
  recruitment: ['ADMIN', 'HR'],
  accounts: ['ADMIN'],
  system: ['ADMIN'],
  profile: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],
}

const DEFAULT_PAGE = 'dashboard'

function pageFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim()
  return raw || DEFAULT_PAGE
}

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('current_user') || 'null') } catch { return null }
  })
  const [page, setPage] = useState(pageFromHash)

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

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

  const navigate = (target) => {
    setPage(target)
    const nextHash = `#/${target}`
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }

  const pages = useMemo(() => ({
    dashboard: <Dashboard user={user} />,
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
  }), [user])

  if (!logged) return <Login onLogin={me => { setUser(me); setLogged(true) }} />
  if (!user) return <div className="loading-screen">Đang tải thông tin tài khoản...</div>

  const allowedPages = Object.fromEntries(Object.entries(access).map(([key, roles]) => [key, roles.includes(user.role)]))
  const pageExists = Object.prototype.hasOwnProperty.call(access, page)
  const forbidden = pageExists && !allowedPages[page]

  let content
  if (!pageExists) {
    content = <AccessDenied user={user} page={page} notFound onHome={() => navigate(DEFAULT_PAGE)} />
  } else if (forbidden) {
    content = <AccessDenied user={user} page={page} onHome={() => navigate(DEFAULT_PAGE)} />
  } else {
    content = pages[page] || <Dashboard user={user} />
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setLogged(false)
    navigate(DEFAULT_PAGE)
  }

  return <Shell page={forbidden || !pageExists ? '' : page} setPage={navigate} onLogout={logout} user={user} allowedPages={allowedPages}>
    {content}
  </Shell>
}

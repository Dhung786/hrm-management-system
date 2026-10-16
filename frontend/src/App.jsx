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

// Mỗi vai trò chỉ nhìn thấy đúng nhóm chức năng phục vụ công việc của mình.
// ADMIN vẫn có toàn quyền để quản trị, kiểm tra và hỗ trợ hệ thống.
const access = {
  dashboard: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],

  // Nhân sự: quản lý hồ sơ/cơ cấu. Trưởng phòng chỉ xem phạm vi phòng mình.
  employees: ['ADMIN', 'HR', 'MANAGER'],
  organization: ['ADMIN', 'HR'],

  // Chấm công: HR quản lý, Trưởng phòng theo dõi phòng mình,
  // Kế toán dùng để đối soát lương, Nhân viên xem/chấm công bản thân.
  attendance: ['ADMIN', 'HR', 'MANAGER', 'PAYROLL', 'EMPLOYEE'],

  // Nghỉ phép: HR/Trưởng phòng xử lý; nhân viên tạo và theo dõi đơn của mình.
  leaves: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],

  // Tiền lương: chỉ quản trị, kế toán và chính nhân viên được xem phạm vi tương ứng.
  payroll: ['ADMIN', 'PAYROLL', 'EMPLOYEE'],

  // Hợp đồng: HR quản lý; kế toán đối soát; nhân viên xem hợp đồng của mình.
  contracts: ['ADMIN', 'HR', 'PAYROLL', 'EMPLOYEE'],

  // Đánh giá: HR/Trưởng phòng thực hiện; nhân viên xem kết quả của mình.
  reviews: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],

  // Tuyển dụng là nghiệp vụ riêng của bộ phận nhân sự.
  recruitment: ['ADMIN', 'HR'],

  // Chỉ Quản trị hệ thống được quản lý tài khoản/phân quyền và giám sát hạ tầng.
  accounts: ['ADMIN'],
  system: ['ADMIN'],

  // Ai cũng được xem hồ sơ của chính mình.
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
  const currentPage = allowedPages[page] ? page : 'dashboard'

  const logout = () => {
    localStorage.clear()
    setUser(null)
    setPage('dashboard')
    setLogged(false)
  }

  return <Shell page={currentPage} setPage={setPage} onLogout={logout} user={user} allowedPages={allowedPages}>
    {pages[currentPage] || <Dashboard user={user} />}
  </Shell>
}

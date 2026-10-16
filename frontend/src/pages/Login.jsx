import { useState } from 'react'
import { request } from '../api'
import { roleLabel } from '../roles'

const demos = [
  ['Quản trị hệ thống', 'admin@hr.local', 'Admin@123'],
  ['Nhân sự', 'hr@hr.local', 'Hr123456'],
  ['Trưởng phòng', 'manager@hr.local', 'Manager123'],
  ['Kế toán tiền lương', 'payroll@hr.local', 'Payroll123'],
  ['Nhân viên', 'employee@hr.local', 'Employee123'],
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@hr.local')
  const [password, setPassword] = useState('Admin@123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('role_label', roleLabel(data.role))
      const me = await request('/api/auth/me')
      localStorage.setItem('current_user', JSON.stringify(me))
      onLogin(me)
    } catch (err) {
      localStorage.removeItem('token'); setError(err.message)
    } finally { setLoading(false) }
  }

  const useDemo = (demoEmail, demoPassword) => { setEmail(demoEmail); setPassword(demoPassword); setError('') }

  return <div className="login-wrap"><div className="login-layout">
    <form className="login-card" onSubmit={submit}>
      <div className="login-logo">HR</div><h1>Đăng nhập HRM</h1><p>Hệ thống quản lý nhân sự và phân quyền theo vai trò.</p>
      <label>Email<input value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
      <label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
    <div className="demo-card"><span>TÀI KHOẢN DEMO</span><h2>Kiểm thử 5 vai trò</h2><p>Chọn một tài khoản để điền nhanh thông tin đăng nhập.</p><div className="demo-list">{demos.map(([label, demoEmail, demoPassword]) => <button type="button" className="demo-account" key={demoEmail} onClick={() => useDemo(demoEmail, demoPassword)}><b>{label}</b><span>{demoEmail}</span></button>)}</div></div>
  </div></div>
}

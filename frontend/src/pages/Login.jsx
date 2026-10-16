import { useState } from 'react'
import { request } from '../api'
import { roleLabel } from '../roles'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('role_label', roleLabel(data.role))

      const me = await request('/api/auth/me')
      localStorage.setItem('current_user', JSON.stringify(me))
      onLogin(me)
    } catch (err) {
      localStorage.removeItem('token')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return <div className="login-wrap">
    <form className="login-card" onSubmit={submit}>
      <div className="login-logo">HR</div>
      <h1>Đăng nhập HRM</h1>
      <p>Hệ thống quản lý nhân sự và phân quyền theo vai trò.</p>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="Nhập email đăng nhập"
          required
        />
      </label>

      <label>
        Mật khẩu
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          required
        />
      </label>

      {error && <div className="error">{error}</div>}

      <button className="primary" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  </div>
}

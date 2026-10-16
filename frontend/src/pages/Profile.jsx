import { useEffect, useState } from 'react'
import { request } from '../api'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    request('/api/auth/me').then(setMe).catch(e => setError(e.message))
  }, [])

  const changePassword = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (form.new_password.length < 8) return setError('Mật khẩu mới phải có ít nhất 8 ký tự')
    if (!/[A-Za-zÀ-ỹ]/.test(form.new_password) || !/\d/.test(form.new_password)) return setError('Mật khẩu mới phải gồm chữ và số')
    if (form.new_password !== form.confirm_password) return setError('Xác nhận mật khẩu không khớp')
    try {
      const data = await request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      })
      setMessage(data.message)
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (e) { setError(e.message) }
  }

  return <section>
    <div className="page-title"><div><span>TÀI KHOẢN</span><h1>Hồ sơ của tôi</h1><p>Thông tin cá nhân, vai trò và bảo mật tài khoản.</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="profile-grid">
      <div className="panel">
        <h2>Thông tin đăng nhập</h2>
        <div className="info-list">
          <div><span>Họ tên</span><b>{me?.full_name || 'Chưa liên kết nhân viên'}</b></div>
          <div><span>Email đăng nhập</span><b>{me?.email || '-'}</b></div>
          <div><span>Vai trò</span><b>{me?.role_label || '-'}</b></div>
          <div><span>Mã nhân viên</span><b>{me?.employee_code || '-'}</b></div>
          <div><span>Phòng ban</span><b>{me?.department_name || '-'}</b></div>
          <div><span>Chức vụ</span><b>{me?.position_name || '-'}</b></div>
        </div>
      </div>
      <div className="panel">
        <h2>Đổi mật khẩu</h2>
        <form className="form-grid" onSubmit={changePassword}>
          <label>Mật khẩu hiện tại<input type="password" value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} required /></label>
          <label>Mật khẩu mới<input type="password" minLength="8" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required /></label>
          <label>Nhập lại mật khẩu mới<input type="password" minLength="8" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required /></label>
          <small className="hint">Tối thiểu 8 ký tự và phải có cả chữ lẫn số.</small>
          <button className="primary">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  </section>
}

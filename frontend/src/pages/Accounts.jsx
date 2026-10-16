import { useEffect, useState } from 'react'
import { request } from '../api'
import { ROLE_OPTIONS, roleLabel } from '../roles'

const blank = { employee_id: '', email: '', password: '', role: 'EMPLOYEE', is_active: true }

export default function Accounts({ user }) {
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [accounts, emps] = await Promise.all([request('/api/accounts'), request('/api/hr/employees')])
      setItems(accounts); setEmployees(emps)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (form.password.length < 8 || !/[A-Za-zÀ-ỹ]/.test(form.password) || !/\d/.test(form.password)) return setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số')
    try {
      await request('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ ...form, employee_id: form.employee_id ? Number(form.employee_id) : null }),
      })
      setForm(blank); setMessage('Đã tạo tài khoản'); await load()
    } catch (e) { setError(e.message) }
  }

  const saveEdit = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      await request(`/api/accounts/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: editing.role, is_active: editing.is_active, password: editing.password || null }),
      })
      setEditing(null); setMessage('Đã cập nhật tài khoản'); await load()
    } catch (e) { setError(e.message) }
  }

  const availableEmployees = employees.filter(emp => !items.some(acc => acc.employee_id === emp.id) && emp.status !== 'INACTIVE')
  const activeCount = items.filter(x => x.is_active).length
  const lockedCount = items.length - activeCount

  return <section>
    <div className="page-title"><div><span>QUẢN TRỊ HỆ THỐNG</span><h1>Tài khoản & phân quyền</h1><p>Tạo tài khoản, liên kết nhân viên, khóa/mở và gán đúng một vai trò cho mỗi tài khoản.</p></div><div className="role-pill">{user?.role_label || 'Quản trị hệ thống'}</div></div>
    <div className="mini-stats"><div><span>Tổng tài khoản</span><b>{items.length}</b></div><div><span>Đang hoạt động</span><b>{activeCount}</b></div><div><span>Đã khóa</span><b>{lockedCount}</b></div><div><span>Chưa có tài khoản</span><b>{availableEmployees.length}</b></div></div>
    <div className="role-action-grid"><div className="role-action-card"><b>Nhân sự</b><span>Quản lý hồ sơ, cơ cấu, nghỉ phép, hợp đồng và tuyển dụng.</span></div><div className="role-action-card"><b>Trưởng phòng</b><span>Xem nhân viên phòng mình, theo dõi chấm công, duyệt nghỉ và đánh giá.</span></div><div className="role-action-card"><b>Kế toán tiền lương</b><span>Đối soát chấm công, hợp đồng và lập bảng lương.</span></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="work-grid">
      <div className="panel form-panel"><div className="panel-heading"><div><span>TẠO MỚI</span><h2>Tạo tài khoản</h2></div></div><form className="form-grid" onSubmit={create}>
        <label>Liên kết nhân viên<select value={form.employee_id} onChange={e => { const employee_id = e.target.value; const emp = employees.find(x => x.id === Number(employee_id)); setForm({ ...form, employee_id, email: emp?.email || form.email }) }}><option value="">-- Không liên kết --</option>{availableEmployees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label>
        <label>Email đăng nhập<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Mật khẩu ban đầu<input type="password" minLength="8" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /><small className="hint">Tối thiểu 8 ký tự, gồm chữ và số.</small></label>
        <label>Vai trò<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{ROLE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        <label className="check-line"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Tài khoản hoạt động</label>
        <button className="primary">Tạo tài khoản</button>
      </form></div>
      <div className="panel data-panel"><div className="panel-heading"><div><span>DANH SÁCH</span><h2>Tài khoản hệ thống</h2></div><small>Chỉ Quản trị hệ thống có quyền chỉnh sửa</small></div><div className="table-wrap"><table><thead><tr><th>Email</th><th>Nhân viên</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td><b>{x.email}</b></td><td>{x.employee_name || '-'}<br/><small>{x.employee_code || ''}</small></td><td>{x.role_label || roleLabel(x.role)}</td><td><span className={x.is_active ? 'badge' : 'badge badge-off'}>{x.is_active ? 'Hoạt động' : 'Đã khóa'}</span></td><td><button onClick={() => setEditing({ ...x, password: '' })}>Phân quyền</button></td></tr>)}</tbody></table></div></div>
    </div>
    {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={saveEdit}><div className="modal-head"><div><span>PHÂN QUYỀN</span><h2>{editing.email}</h2></div><button type="button" onClick={() => setEditing(null)}>✕</button></div>
      <label>Vai trò<select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>{ROLE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
      <label className="check-line"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Tài khoản hoạt động</label>
      <label>Đặt lại mật khẩu (không bắt buộc)<input type="password" minLength="8" value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} placeholder="Để trống nếu không đổi" /></label>
      <div className="actions"><button type="button" onClick={() => setEditing(null)}>Hủy</button><button className="primary">Lưu thay đổi</button></div>
    </form></div>}
  </section>
}

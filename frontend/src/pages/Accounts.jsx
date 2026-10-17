import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus, RefreshCw, Search, Trash2, UserRoundCheck, UserRoundX, UsersRound } from 'lucide-react'
import { request } from '../api'
import { ROLE_OPTIONS, roleLabel } from '../roles'

const INTERNAL_ROLE_OPTIONS = ROLE_OPTIONS.filter(x => x.value !== 'ADMIN')
const blank = { employee_id: '', email: '', password: '', role: 'EMPLOYEE', is_active: true }

function usernameFromStored(value) {
  const login = String(value || '').trim()
  if (!login) return ''
  if (login.toLowerCase().endsWith('@hr.local')) return login.slice(0, -9)
  return login.includes('@') ? login.split('@')[0] : login
}

function generateTemporaryPassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const all = letters + digits
  const bytes = new Uint32Array(8)
  crypto.getRandomValues(bytes)
  const chars = [letters[bytes[0] % letters.length], digits[bytes[1] % digits.length]]
  for (let i = 2; i < 8; i += 1) chars.push(all[bytes[i] % all.length])
  const shuffleBytes = new Uint32Array(chars.length)
  crypto.getRandomValues(shuffleBytes)
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = shuffleBytes[i] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export default function Accounts({ user }) {
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [accounts, emps] = await Promise.all([request('/api/accounts'), request('/api/hr/employees')])
      setItems(accounts); setEmployees(emps)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const closeCreate = () => {
    setShowCreate(false)
    setShowCreatePassword(false)
    setForm(blank)
  }

  const selectEmployee = (employeeId) => {
    if (!employeeId) {
      setForm(blank)
      setShowCreatePassword(false)
      return
    }
    const emp = employees.find(x => x.id === Number(employeeId))
    setForm({ employee_id: employeeId, email: emp?.email || '', password: generateTemporaryPassword(), role: 'EMPLOYEE', is_active: true })
    setShowCreatePassword(false)
    setError('')
  }

  const regeneratePassword = () => {
    setForm(current => ({ ...current, password: generateTemporaryPassword() }))
    setShowCreatePassword(true)
  }

  const create = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (!form.employee_id) return setError('Vui lòng chọn nhân viên trước khi tạo tài khoản')
    if (!form.email) return setError('Nhân viên chưa có tên đăng nhập. Hãy cập nhật hồ sơ nhân viên trước.')
    if (form.password.length !== 8 || !/[A-Za-zÀ-ỹ]/.test(form.password) || !/\d/.test(form.password)) return setError('Mật khẩu tạm phải có đúng 8 ký tự, gồm chữ và số')
    try {
      await request('/api/accounts', { method: 'POST', body: JSON.stringify({ ...form, employee_id: Number(form.employee_id) }) })
      const accountUsername = usernameFromStored(form.email)
      closeCreate()
      setMessage(`Đã tạo tài khoản ${accountUsername}. Mật khẩu tạm chỉ dùng để bàn giao cho nhân viên.`)
      await load()
    } catch (e) { setError(e.message) }
  }

  const saveEdit = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      await request(`/api/accounts/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: editing.role, is_active: editing.is_active, password: editing.password || null }),
      })
      setEditing(null); setShowEditPassword(false); setMessage('Đã cập nhật tài khoản'); await load()
    } catch (e) { setError(e.message) }
  }

  const removeAccount = async (x) => {
    if (!confirm(`Xóa tài khoản ${usernameFromStored(x.email)}?\n\nHồ sơ nhân viên vẫn được giữ lại. Thao tác này không thể hoàn tác.`)) return
    setError(''); setMessage('')
    try {
      await request(`/api/accounts/${x.id}`, { method: 'DELETE' })
      setMessage(`Đã xóa tài khoản ${usernameFromStored(x.email)}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  const availableEmployees = employees.filter(emp => !items.some(acc => acc.employee_id === emp.id) && emp.status !== 'INACTIVE')
  const activeCount = items.filter(x => x.is_active).length
  const lockedCount = items.length - activeCount
  const withoutAccountCount = availableEmployees.length

  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const username = usernameFromStored(x.email)
    const matchesQuery = !keyword || [username, x.employee_name, x.employee_code, x.role_label, roleLabel(x.role)].some(v => String(v || '').toLowerCase().includes(keyword))
    const matchesRole = roleFilter === 'ALL' || x.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? x.is_active : !x.is_active)
    return matchesQuery && matchesRole && matchesStatus
  }), [items, query, roleFilter, statusFilter])

  return <section>
    <div className="page-title page-title-modern">
      <div><span>QUẢN TRỊ HỆ THỐNG</span><h1>Quản lý tài khoản</h1><p>Tạo tài khoản, gán vai trò và kiểm soát trạng thái đăng nhập của nhân sự.</p></div>
      <button className="primary page-primary-action" onClick={() => { setForm(blank); setShowCreatePassword(false); setShowCreate(true) }}><Plus size={17}/> Tạo tài khoản</button>
    </div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><UsersRound size={20}/></div><div><span>Tổng tài khoản</span><strong>{items.length}</strong><small>Tất cả tài khoản hệ thống</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><UserRoundCheck size={20}/></div><div><span>Đang hoạt động</span><strong>{activeCount}</strong><small>Có thể đăng nhập</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><UserRoundX size={20}/></div><div><span>Tài khoản bị khóa</span><strong>{lockedCount}</strong><small>{lockedCount ? 'Cần kiểm tra trạng thái nhân sự/tài khoản' : 'Không có tài khoản bị khóa'}</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><UsersRound size={20}/></div><div><span>Chưa có tài khoản</span><strong>{withoutAccountCount}</strong><small>Nhân viên đang làm việc chưa được cấp tài khoản</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel account-list-panel">
      <div className="filter-bar">
        <label className="search-box"><Search size={17}/><input placeholder="Tìm theo nhân viên, tên đăng nhập, mã..." value={query} onChange={e => setQuery(e.target.value)} /></label>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option value="ALL">Tất cả vai trò</option>{ROLE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select>
      </div>
      <div className="table-wrap"><table><thead><tr><th>STT</th><th>Nhân viên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filteredItems.map((x, index) => <tr key={x.id}><td>{index + 1}</td><td><div className="person-cell"><div className="person-avatar">{(x.employee_name || usernameFromStored(x.email) || 'N').charAt(0).toUpperCase()}</div><div><b>{x.employee_name || 'Chưa liên kết nhân viên'}</b><small>{x.employee_code || '-'}</small></div></div></td><td><b>{usernameFromStored(x.email)}</b></td><td><span className="role-chip">{x.role_label || roleLabel(x.role)}</span></td><td><span className={x.is_active ? 'badge' : 'badge badge-off'}>{x.is_active ? 'Đang hoạt động' : 'Đã khóa'}</span></td><td><div className="actions"><button onClick={() => { setEditing({ ...x, password: '' }); setShowEditPassword(false) }}>Quản lý</button>{x.id !== user?.id && <button className="danger" onClick={() => removeAccount(x)}><Trash2 size={14}/> Xóa</button>}</div></td></tr>)}</tbody></table></div>
      <div className="table-footer">Hiển thị {filteredItems.length} / {items.length} tài khoản</div>
    </div>

    {showCreate && <div className="modal-backdrop"><form className="modal-card account-modal" onSubmit={create}>
      <div className="modal-head"><div><span>TẠO TÀI KHOẢN</span><h2>Thêm tài khoản nhân sự</h2></div><button type="button" onClick={closeCreate}>✕</button></div>
      <label>1. Chọn nhân viên<select value={form.employee_id} onChange={e => selectEmployee(e.target.value)} required><option value="">-- Chọn nhân viên --</option>{availableEmployees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select><small className="hint">Chọn nhân viên trước. Tên đăng nhập và mật khẩu tạm sẽ xuất hiện sau khi chọn.</small></label>
      {form.employee_id && <>
        <div className="account-generated-fields">
          <label>Tên đăng nhập<input type="text" value={usernameFromStored(form.email)} readOnly /><small className="hint">Lấy tự động từ hồ sơ nhân viên.</small></label>
          <label>Mật khẩu tạm<div className="password-field-wrap"><input type={showCreatePassword ? 'text' : 'password'} value={form.password} readOnly /><button type="button" className="password-eye-button" onClick={() => setShowCreatePassword(value => !value)} aria-label={showCreatePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={showCreatePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showCreatePassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><div className="password-help-row"><small className="hint">Hệ thống tự sinh đúng 8 ký tự gồm chữ và số.</small><button type="button" className="link-button" onClick={regeneratePassword}><RefreshCw size={14}/> Sinh mật khẩu khác</button></div></label>
        </div>
        <label>Vai trò<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{INTERNAL_ROLE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        <label className="check-line"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Đang làm việc / được phép đăng nhập</label>
      </>}
      <div className="actions"><button type="button" onClick={closeCreate}>Hủy</button><button className="primary" disabled={!form.employee_id}>Tạo tài khoản</button></div>
    </form></div>}

    {editing && <div className="modal-backdrop"><form className="modal-card" onSubmit={saveEdit}><div className="modal-head"><div><span>QUẢN LÝ TÀI KHOẢN</span><h2>{editing.employee_name || usernameFromStored(editing.email)}</h2></div><button type="button" onClick={() => { setEditing(null); setShowEditPassword(false) }}>✕</button></div>
      <label>Vai trò<select value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value })}>{editing.role === 'ADMIN' && <option value="ADMIN">Quản trị hệ thống</option>}{INTERNAL_ROLE_OPTIONS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
      <label className="check-line"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Tài khoản đang hoạt động</label>
      <label>Đặt lại mật khẩu (không bắt buộc)<div className="password-field-wrap"><input type={showEditPassword ? 'text' : 'password'} minLength="8" value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} placeholder="Để trống nếu không đổi" /><button type="button" className="password-eye-button" onClick={() => setShowEditPassword(value => !value)} aria-label={showEditPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showEditPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
      <div className="actions"><button type="button" onClick={() => { setEditing(null); setShowEditPassword(false) }}>Hủy</button><button className="primary">Lưu thay đổi</button></div>
    </form></div>}
  </section>
}

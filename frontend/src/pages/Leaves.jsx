import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, CalendarClock, CalendarDays, Plus, Search, XCircle } from 'lucide-react'
import { request } from '../api'
import { canApproveLeave } from '../roles'

const blank = { employee_id: '', leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '' }
const leaveLabel = { ANNUAL: 'Phép năm', SICK: 'Nghỉ ốm', UNPAID: 'Không lương', MATERNITY: 'Thai sản', OTHER: 'Khác' }
const statusLabel = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }

export default function Leaves({ user }) {
  const role = user?.role
  const canApprove = canApproveLeave(role)
  const createForOthers = ['ADMIN', 'HR'].includes(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ ...blank, employee_id: createForOthers ? '' : (user?.employee_id || '') })
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [leaves, emps] = await Promise.all([request('/api/leaves'), request('/api/hr/employees')])
      setItems(leaves); setEmployees(emps.filter(x => x.status !== 'INACTIVE'))
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    const employeeId = createForOthers ? form.employee_id : user?.employee_id
    if (!employeeId) return setError('Tài khoản chưa liên kết với nhân viên')
    if (!form.start_date || !form.end_date) return setError('Vui lòng chọn đầy đủ ngày nghỉ')
    if (form.start_date > form.end_date) return setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
    try {
      await request('/api/leaves', { method: 'POST', body: JSON.stringify({ ...form, employee_id: Number(employeeId), reason: form.reason || null }) })
      setForm({ ...blank, employee_id: createForOthers ? '' : (user?.employee_id || '') }); setShowCreate(false); setMessage('Gửi đơn nghỉ thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const decide = async (id, status) => {
    setError(''); setMessage('')
    try {
      await request(`/api/leaves/${id}/decision`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setMessage(status === 'APPROVED' ? 'Đã duyệt đơn nghỉ' : 'Đã từ chối đơn nghỉ'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (user?.employee_id === id ? user.full_name : `#${id}`)
  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${empName(x.employee_id)} ${x.reason || ''}`.toLowerCase().includes(keyword)
    const matchesType = typeFilter === 'ALL' || x.leave_type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || x.status === statusFilter
    return matchesText && matchesType && matchesStatus
  }), [items, query, typeFilter, statusFilter, employees])

  const pending = items.filter(x => x.status === 'PENDING').length
  const approved = items.filter(x => x.status === 'APPROVED').length
  const rejected = items.filter(x => x.status === 'REJECTED').length
  const title = role === 'EMPLOYEE' ? 'Nghỉ phép của tôi' : role === 'MANAGER' ? 'Nghỉ phép phòng ban' : 'Quản lý nghỉ phép'

  return <section>
    <div className="page-title page-title-modern"><div><span>NGHỈ PHÉP</span><h1>{title}</h1><p>{canApprove ? 'Theo dõi, duyệt và từ chối đơn nghỉ trong phạm vi được phân quyền.' : 'Tạo và theo dõi các yêu cầu nghỉ phép của bạn.'}</p></div><button className="primary page-primary-action" onClick={() => setShowCreate(true)}><Plus size={17}/> Tạo đơn nghỉ</button></div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><CalendarDays size={20}/></div><div><span>Tổng đơn</span><strong>{items.length}</strong><small>Tất cả yêu cầu nghỉ</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><CalendarClock size={20}/></div><div><span>Chờ duyệt</span><strong>{pending}</strong><small>Cần được xử lý</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><CalendarCheck2 size={20}/></div><div><span>Đã duyệt</span><strong>{approved}</strong><small>Yêu cầu đã chấp nhận</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><XCircle size={20}/></div><div><span>Từ chối</span><strong>{rejected}</strong><small>Yêu cầu không được duyệt</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel">
      <div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm nhân viên hoặc lý do nghỉ..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="ALL">Tất cả loại nghỉ</option>{Object.entries(leaveLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="table-wrap"><table><thead><tr><th>STT</th><th>Nhân viên</th><th>Loại nghỉ</th><th>Thời gian</th><th>Lý do</th><th>Trạng thái</th>{canApprove && <th>Thao tác</th>}</tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{empName(x.employee_id)}</b></td><td>{leaveLabel[x.leave_type] || x.leave_type}</td><td>{x.start_date}<br/><small>đến {x.end_date}</small></td><td>{x.reason || '-'}</td><td><span className={x.status === 'APPROVED' ? 'badge' : x.status === 'REJECTED' ? 'badge badge-off' : 'badge badge-wait'}>{statusLabel[x.status] || x.status}</span></td>{canApprove && <td>{x.status === 'PENDING' ? <div className="actions"><button onClick={() => decide(x.id, 'APPROVED')}>Duyệt</button><button className="danger" onClick={() => decide(x.id, 'REJECTED')}>Từ chối</button></div> : <small>Đã xử lý</small>}</td>}</tr>)}</tbody></table></div><div className="table-footer">Hiển thị {filteredItems.length} / {items.length} đơn nghỉ</div>
    </div>

    {showCreate && <div className="modal-backdrop"><form className="modal-card" onSubmit={create}><div className="modal-head"><div><span>NGHỈ PHÉP</span><h2>Tạo yêu cầu nghỉ</h2></div><button type="button" onClick={() => setShowCreate(false)}>✕</button></div>{createForOthers ? <label>Nhân viên<select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label> : <div className="self-info">Nhân viên: <b>{user?.full_name || 'Chưa liên kết'}</b></div>}<label>Loại nghỉ<select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>{Object.entries(leaveLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="form-grid two-col-form"><label>Từ ngày<input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></label><label>Đến ngày<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></label></div><label>Lý do<textarea maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label><div className="actions"><button type="button" onClick={() => setShowCreate(false)}>Hủy</button><button className="primary">Gửi đơn</button></div></form></div>}
  </section>
}

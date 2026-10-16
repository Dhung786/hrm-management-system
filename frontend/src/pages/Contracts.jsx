import { useEffect, useMemo, useState } from 'react'
import { FileCheck2, FileClock, FileText, Plus, Search, XCircle } from 'lucide-react'
import { request } from '../api'
import { canManageEmployees } from '../roles'

const blank = { employee_id: '', contract_no: '', contract_type: 'FIXED_TERM', start_date: '', end_date: '', salary: 0, status: 'ACTIVE' }
const typeLabel = { FIXED_TERM: 'Có thời hạn', INDEFINITE: 'Không xác định thời hạn', PROBATION: 'Thử việc' }
const statusLabel = { ACTIVE: 'Đang hiệu lực', EXPIRED: 'Hết hạn', TERMINATED: 'Đã chấm dứt' }

export default function Contracts({ user }) {
  const role = user?.role
  const editable = canManageEmployees(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [contracts, emps] = await Promise.all([request('/api/talent/contracts'), request('/api/hr/employees')])
      setItems(contracts); setEmployees(emps.filter(x => x.status !== 'INACTIVE'))
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (!form.employee_id) return setError('Vui lòng chọn nhân viên')
    if (form.end_date && form.end_date < form.start_date) return setError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu')
    if (Number(form.salary) < 0) return setError('Mức lương không được âm')
    try {
      await request('/api/talent/contracts', { method: 'POST', body: JSON.stringify({ ...form, employee_id: Number(form.employee_id), salary: Number(form.salary), end_date: form.end_date || null }) })
      setForm(blank); setShowCreate(false); setMessage('Tạo hợp đồng thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (user?.employee_id === id ? user.full_name : `#${id}`)
  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${x.contract_no} ${empName(x.employee_id)}`.toLowerCase().includes(keyword)
    const matchesType = typeFilter === 'ALL' || x.contract_type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || x.status === statusFilter
    return matchesText && matchesType && matchesStatus
  }), [items, query, typeFilter, statusFilter, employees])

  const active = items.filter(x => x.status === 'ACTIVE').length
  const expired = items.filter(x => x.status === 'EXPIRED').length
  const terminated = items.filter(x => x.status === 'TERMINATED').length
  const title = role === 'EMPLOYEE' ? 'Hợp đồng của tôi' : role === 'PAYROLL' ? 'Đối soát hợp đồng' : 'Hợp đồng lao động'

  return <section>
    <div className="page-title page-title-modern"><div><span>HỢP ĐỒNG</span><h1>{title}</h1><p>{editable ? 'Tạo và quản lý hợp đồng lao động của nhân viên.' : role === 'PAYROLL' ? 'Xem thông tin hợp đồng phục vụ đối soát tiền lương.' : 'Xem hợp đồng thuộc hồ sơ của chính bạn.'}</p></div>{editable && <button className="primary page-primary-action" onClick={() => setShowCreate(true)}><Plus size={17}/> Tạo hợp đồng</button>}</div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><FileText size={20}/></div><div><span>Tổng hợp đồng</span><strong>{items.length}</strong><small>Tất cả hợp đồng trong phạm vi</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><FileCheck2 size={20}/></div><div><span>Đang hiệu lực</span><strong>{active}</strong><small>Hợp đồng còn hiệu lực</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><FileClock size={20}/></div><div><span>Hết hạn</span><strong>{expired}</strong><small>Hợp đồng đã hết hạn</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><XCircle size={20}/></div><div><span>Đã chấm dứt</span><strong>{terminated}</strong><small>Hợp đồng kết thúc trước hạn</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel"><div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm số hợp đồng hoặc nhân viên..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="ALL">Tất cả loại hợp đồng</option>{Object.entries(typeLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Số hợp đồng</th><th>Nhân viên</th><th>Loại</th><th>Hiệu lực</th><th>Mức lương</th><th>Trạng thái</th></tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{x.contract_no}</b></td><td>{empName(x.employee_id)}</td><td><span className="role-chip">{typeLabel[x.contract_type] || x.contract_type}</span></td><td>{x.start_date}<br/><small>đến {x.end_date || 'Không thời hạn'}</small></td><td>{Number(x.salary).toLocaleString('vi-VN')} đ</td><td><span className={x.status === 'ACTIVE' ? 'badge' : x.status === 'EXPIRED' ? 'badge badge-wait' : 'badge badge-off'}>{statusLabel[x.status] || x.status}</span></td></tr>)}</tbody></table></div><div className="table-footer">Hiển thị {filteredItems.length} / {items.length} hợp đồng</div></div>

    {showCreate && editable && <div className="modal-backdrop"><form className="modal-card" onSubmit={save}><div className="modal-head"><div><span>HỢP ĐỒNG</span><h2>Tạo hợp đồng mới</h2></div><button type="button" onClick={() => setShowCreate(false)}>✕</button></div><label>Nhân viên<select value={form.employee_id} onChange={e => { const id = e.target.value; const emp = employees.find(x => x.id === Number(id)); setForm({ ...form, employee_id: id, salary: emp?.base_salary || 0 }) }} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label><label>Số hợp đồng<input maxLength={60} value={form.contract_no} onChange={e => setForm({ ...form, contract_no: e.target.value.toUpperCase() })} required /></label><label>Loại hợp đồng<select value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}>{Object.entries(typeLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="form-grid two-col-form"><label>Ngày bắt đầu<input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></label><label>Ngày kết thúc<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></label></div><label>Mức lương<input type="number" min="0" step="1000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></label><label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="actions"><button type="button" onClick={() => setShowCreate(false)}>Hủy</button><button className="primary">Lưu hợp đồng</button></div></form></div>}
  </section>
}

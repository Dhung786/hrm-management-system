import { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, CircleDollarSign, Plus, Search, WalletCards, WalletMinimal } from 'lucide-react'
import { request } from '../api'
import { canManagePayroll } from '../roles'

const now = new Date()
const blank = { employee_id: '', month: now.getMonth() + 1, year: now.getFullYear(), base_salary: 0, allowance: 0, bonus: 0, deduction: 0, status: 'DRAFT' }
const statusLabel = { DRAFT: 'Nháp', APPROVED: 'Đã duyệt', PAID: 'Đã trả' }

export default function Payroll({ user }) {
  const role = user?.role
  const editable = canManagePayroll(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [payroll, emps] = await Promise.all([request('/api/payroll'), request('/api/hr/employees')])
      setItems(payroll); setEmployees(emps.filter(x => x.status !== 'INACTIVE'))
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    const nums = ['base_salary', 'allowance', 'bonus', 'deduction']
    if (!form.employee_id) return setError('Vui lòng chọn nhân viên')
    if (Number(form.month) < 1 || Number(form.month) > 12) return setError('Tháng phải từ 1 đến 12')
    if (nums.some(k => Number(form[k]) < 0)) return setError('Các khoản tiền không được âm')
    if (Number(form.deduction) > Number(form.base_salary) + Number(form.allowance) + Number(form.bonus)) return setError('Khấu trừ không được lớn hơn tổng thu nhập')
    try {
      const payload = { ...form, employee_id: Number(form.employee_id), month: Number(form.month), year: Number(form.year) }
      nums.forEach(k => { payload[k] = Number(form[k]) })
      await request('/api/payroll', { method: 'POST', body: JSON.stringify(payload) })
      setForm(blank); setShowCreate(false); setMessage('Tạo bảng lương thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (user?.employee_id === id ? user.full_name : `#${id}`)
  const periods = useMemo(() => [...new Set(items.map(x => `${x.month}/${x.year}`))], [items])
  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${empName(x.employee_id)} ${x.month}/${x.year}`.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter === 'ALL' || x.status === statusFilter
    const matchesPeriod = periodFilter === 'ALL' || `${x.month}/${x.year}` === periodFilter
    return matchesText && matchesStatus && matchesPeriod
  }), [items, query, statusFilter, periodFilter, employees])

  const paid = items.filter(x => x.status === 'PAID').length
  const approved = items.filter(x => x.status === 'APPROVED').length
  const totalNet = items.reduce((sum, x) => sum + Number(x.net_salary || 0), 0)

  return <section>
    <div className="page-title page-title-modern"><div><span>TIỀN LƯƠNG</span><h1>{role === 'EMPLOYEE' ? 'Phiếu lương của tôi' : 'Quản lý bảng lương'}</h1><p>{editable ? 'Lập bảng lương, phụ cấp, thưởng, khấu trừ và theo dõi trạng thái chi trả.' : 'Xem lịch sử lương thuộc hồ sơ của chính bạn.'}</p></div>{editable && <button className="primary page-primary-action" onClick={() => setShowCreate(true)}><Plus size={17}/> Lập bảng lương</button>}</div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><WalletCards size={20}/></div><div><span>Bảng lương</span><strong>{items.length}</strong><small>Tổng số bảng lương</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><BadgeDollarSign size={20}/></div><div><span>Đã trả</span><strong>{paid}</strong><small>Hoàn tất thanh toán</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><WalletMinimal size={20}/></div><div><span>Đã duyệt</span><strong>{approved}</strong><small>Chờ hoặc sẵn sàng chi trả</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><CircleDollarSign size={20}/></div><div><span>Tổng thực nhận</span><strong>{totalNet.toLocaleString('vi-VN')}</strong><small>đồng trong phạm vi hiển thị</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel"><div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm nhân viên hoặc kỳ lương..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}><option value="ALL">Tất cả kỳ lương</option>{periods.map(x => <option key={x} value={x}>{x}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Nhân viên</th><th>Kỳ lương</th><th>Lương cơ bản</th><th>Phụ cấp</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>Trạng thái</th></tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{empName(x.employee_id)}</b></td><td>{x.month}/{x.year}</td><td>{Number(x.base_salary).toLocaleString('vi-VN')} đ</td><td>{Number(x.allowance).toLocaleString('vi-VN')} đ</td><td>{Number(x.bonus).toLocaleString('vi-VN')} đ</td><td>{Number(x.deduction).toLocaleString('vi-VN')} đ</td><td><b>{Number(x.net_salary).toLocaleString('vi-VN')} đ</b></td><td><span className={x.status === 'PAID' ? 'badge' : x.status === 'APPROVED' ? 'badge badge-wait' : 'role-chip'}>{statusLabel[x.status] || x.status}</span></td></tr>)}</tbody></table></div><div className="table-footer">Hiển thị {filteredItems.length} / {items.length} bảng lương</div></div>

    {showCreate && editable && <div className="modal-backdrop"><form className="modal-card payroll-modal" onSubmit={save}><div className="modal-head"><div><span>TIỀN LƯƠNG</span><h2>Lập bảng lương</h2></div><button type="button" onClick={() => setShowCreate(false)}>✕</button></div><label>Nhân viên<select value={form.employee_id} onChange={e => { const id = e.target.value; const emp = employees.find(x => x.id === Number(id)); setForm({ ...form, employee_id: id, base_salary: emp?.base_salary || 0 }) }} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label><div className="form-grid two-col-form"><label>Tháng<input type="number" min="1" max="12" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required /></label><label>Năm<input type="number" min="2000" max="2100" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required /></label><label>Lương cơ bản<input type="number" min="0" step="1000" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} required /></label><label>Phụ cấp<input type="number" min="0" step="1000" value={form.allowance} onChange={e => setForm({ ...form, allowance: e.target.value })} /></label><label>Thưởng<input type="number" min="0" step="1000" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} /></label><label>Khấu trừ<input type="number" min="0" step="1000" value={form.deduction} onChange={e => setForm({ ...form, deduction: e.target.value })} /></label></div><label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Nháp</option><option value="APPROVED">Đã duyệt</option><option value="PAID">Đã trả</option></select></label><div className="actions"><button type="button" onClick={() => setShowCreate(false)}>Hủy</button><button className="primary">Tạo bảng lương</button></div></form></div>}
  </section>
}

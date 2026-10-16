import { useEffect, useState } from 'react'
import { request } from '../api'
import { canManageEmployees } from '../roles'

const blank = { employee_id: '', contract_no: '', contract_type: 'FIXED_TERM', start_date: '', end_date: '', salary: 0, status: 'ACTIVE' }
const typeLabel = { FIXED_TERM: 'Có thời hạn', INDEFINITE: 'Không xác định thời hạn', PROBATION: 'Thử việc' }
const statusLabel = { ACTIVE: 'Đang hiệu lực', EXPIRED: 'Hết hạn', TERMINATED: 'Đã chấm dứt' }

export default function Contracts() {
  const role = localStorage.getItem('role')
  const editable = canManageEmployees(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
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
      setForm(blank); setMessage('Tạo hợp đồng thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || `#${id}`

  return <section>
    <div className="page-title"><div><span>HỢP ĐỒNG</span><h1>{role === 'EMPLOYEE' ? 'Hợp đồng của tôi' : 'Hợp đồng lao động'}</h1><p>{editable ? 'Quản lý số hợp đồng, loại hợp đồng, thời hạn và mức lương.' : 'Hợp đồng hiển thị theo phạm vi quyền của tài khoản.'}</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className={editable ? 'split' : ''}>
      {editable && <div className="panel"><h2>Tạo hợp đồng</h2><form className="form-grid" onSubmit={save}>
        <label>Nhân viên<select value={form.employee_id} onChange={e => { const id = e.target.value; const emp = employees.find(x => x.id === Number(id)); setForm({ ...form, employee_id: id, salary: emp?.base_salary || 0 }) }} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label>
        <label>Số hợp đồng<input maxLength={60} value={form.contract_no} onChange={e => setForm({ ...form, contract_no: e.target.value.toUpperCase() })} required /></label>
        <label>Loại hợp đồng<select value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })}>{Object.entries(typeLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Ngày bắt đầu<input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></label>
        <label>Ngày kết thúc<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
        <label>Mức lương<input type="number" min="0" step="1000" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></label>
        <label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="primary">Lưu hợp đồng</button>
      </form></div>}
      <div className="panel grow"><div className="table-wrap"><table><thead><tr><th>Số HĐ</th><th>Nhân viên</th><th>Loại</th><th>Hiệu lực</th><th>Lương</th><th>Trạng thái</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td><b>{x.contract_no}</b></td><td>{empName(x.employee_id)}</td><td>{typeLabel[x.contract_type] || x.contract_type}</td><td>{x.start_date} → {x.end_date || 'Không thời hạn'}</td><td>{Number(x.salary).toLocaleString('vi-VN')} đ</td><td><span className={x.status === 'ACTIVE' ? 'badge' : 'badge badge-off'}>{statusLabel[x.status] || x.status}</span></td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

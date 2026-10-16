import { useEffect, useState } from 'react'
import { request } from '../api'
import { canManagePayroll } from '../roles'

const now = new Date()
const blank = { employee_id: '', month: now.getMonth() + 1, year: now.getFullYear(), base_salary: 0, allowance: 0, bonus: 0, deduction: 0, status: 'DRAFT' }
const statusLabel = { DRAFT: 'Nháp', APPROVED: 'Đã duyệt', PAID: 'Đã trả' }

export default function Payroll() {
  const role = localStorage.getItem('role')
  const editable = canManagePayroll(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
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
      setForm(blank); setMessage('Tạo bảng lương thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || `#${id}`

  return <section>
    <div className="page-title"><div><span>TIỀN LƯƠNG</span><h1>{role === 'EMPLOYEE' ? 'Phiếu lương của tôi' : 'Bảng lương'}</h1><p>{editable ? 'Quản lý lương cơ bản, phụ cấp, thưởng và khấu trừ.' : 'Bạn chỉ được xem bảng lương của chính mình.'}</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className={editable ? 'split' : ''}>
      {editable && <div className="panel"><h2>Tạo bảng lương</h2><form className="form-grid" onSubmit={save}>
        <label>Nhân viên<select value={form.employee_id} onChange={e => { const id = e.target.value; const emp = employees.find(x => x.id === Number(id)); setForm({ ...form, employee_id: id, base_salary: emp?.base_salary || 0 }) }} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label>
        <label>Tháng<input type="number" min="1" max="12" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required /></label>
        <label>Năm<input type="number" min="2000" max="2100" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required /></label>
        <label>Lương cơ bản<input type="number" min="0" step="1000" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} required /></label>
        <label>Phụ cấp<input type="number" min="0" step="1000" value={form.allowance} onChange={e => setForm({ ...form, allowance: e.target.value })} /></label>
        <label>Thưởng<input type="number" min="0" step="1000" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })} /></label>
        <label>Khấu trừ<input type="number" min="0" step="1000" value={form.deduction} onChange={e => setForm({ ...form, deduction: e.target.value })} /></label>
        <label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Nháp</option><option value="APPROVED">Đã duyệt</option><option value="PAID">Đã trả</option></select></label>
        <button className="primary">Tạo bảng lương</button>
      </form></div>}
      <div className="panel grow"><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Tháng</th><th>Lương cơ bản</th><th>Phụ cấp</th><th>Thưởng</th><th>Khấu trừ</th><th>Thực nhận</th><th>Trạng thái</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{empName(x.employee_id)}</td><td>{x.month}/{x.year}</td>{['base_salary','allowance','bonus','deduction','net_salary'].map(k => <td key={k}>{Number(x[k]).toLocaleString('vi-VN')} đ</td>)}<td><span className={x.status === 'PAID' ? 'badge' : 'badge badge-wait'}>{statusLabel[x.status] || x.status}</span></td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

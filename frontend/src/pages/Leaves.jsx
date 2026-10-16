import { useEffect, useState } from 'react'
import { request } from '../api'

const blank = { employee_id: '', leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '' }

export default function Leaves() {
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [leaves, emps] = await Promise.all([request('/api/leaves'), request('/api/hr/employees')])
      setItems(leaves)
      setEmployees(emps.filter(x => x.status !== 'INACTIVE'))
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (!form.employee_id) return setError('Vui lòng chọn nhân viên')
    if (!form.start_date || !form.end_date) return setError('Vui lòng chọn đầy đủ ngày nghỉ')
    if (form.start_date > form.end_date) return setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
    try {
      await request('/api/leaves', { method: 'POST', body: JSON.stringify({ ...form, employee_id: Number(form.employee_id), reason: form.reason || null }) })
      setForm(blank); setMessage('Tạo đơn nghỉ thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const decide = async (id, status) => {
    setError(''); setMessage('')
    try {
      await request(`/api/leaves/${id}/decision`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setMessage(status === 'APPROVED' ? 'Đã duyệt đơn nghỉ' : 'Đã từ chối đơn nghỉ')
      await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || `#${id}`

  return <section>
    <div className="page-title"><div><span>NGHỈ PHÉP</span><h1>Đơn xin nghỉ</h1></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="split">
      <div className="panel"><h2>Tạo đơn nghỉ</h2><form className="form-grid" onSubmit={create}>
        <label>Nhân viên<select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label>
        <label>Loại nghỉ<select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}><option value="ANNUAL">Phép năm</option><option value="SICK">Nghỉ ốm</option><option value="UNPAID">Không lương</option><option value="MATERNITY">Thai sản</option><option value="OTHER">Khác</option></select></label>
        <label>Từ ngày<input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></label>
        <label>Đến ngày<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></label>
        <label>Lý do<textarea maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
        <button className="primary">Gửi đơn</button>
      </form></div>
      <div className="panel grow"><div className="table-wrap"><table><thead><tr><th>NV</th><th>Loại</th><th>Từ ngày</th><th>Đến ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{empName(x.employee_id)}</td><td>{x.leave_type}</td><td>{x.start_date}</td><td>{x.end_date}</td><td>{x.reason || '-'}</td><td>{x.status}</td><td>{x.status === 'PENDING' && <div className="actions"><button onClick={() => decide(x.id, 'APPROVED')}>Duyệt</button><button className="danger" onClick={() => decide(x.id, 'REJECTED')}>Từ chối</button></div>}</td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

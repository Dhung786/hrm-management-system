import { useEffect, useState } from 'react'
import { request } from '../api'
import { canApproveLeave } from '../roles'

const blank = { employee_id: '', leave_type: 'ANNUAL', start_date: '', end_date: '', reason: '' }
const leaveLabel = { ANNUAL: 'Phép năm', SICK: 'Nghỉ ốm', UNPAID: 'Không lương', MATERNITY: 'Thai sản', OTHER: 'Khác' }
const statusLabel = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }

export default function Leaves() {
  const role = localStorage.getItem('role')
  const me = (() => { try { return JSON.parse(localStorage.getItem('current_user') || 'null') } catch { return null } })()
  const canApprove = canApproveLeave(role)
  const createForOthers = ['ADMIN', 'HR'].includes(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ ...blank, employee_id: createForOthers ? '' : (me?.employee_id || '') })
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
    const employeeId = createForOthers ? form.employee_id : me?.employee_id
    if (!employeeId) return setError('Tài khoản chưa liên kết với nhân viên')
    if (!form.start_date || !form.end_date) return setError('Vui lòng chọn đầy đủ ngày nghỉ')
    if (form.start_date > form.end_date) return setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
    try {
      await request('/api/leaves', { method: 'POST', body: JSON.stringify({ ...form, employee_id: Number(employeeId), reason: form.reason || null }) })
      setForm({ ...blank, employee_id: createForOthers ? '' : (me?.employee_id || '') }); setMessage('Gửi đơn nghỉ thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const decide = async (id, status) => {
    setError(''); setMessage('')
    try {
      await request(`/api/leaves/${id}/decision`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setMessage(status === 'APPROVED' ? 'Đã duyệt đơn nghỉ' : 'Đã từ chối đơn nghỉ'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (me?.employee_id === id ? me.full_name : `#${id}`)

  return <section>
    <div className="page-title"><div><span>NGHỈ PHÉP</span><h1>{role === 'EMPLOYEE' ? 'Nghỉ phép của tôi' : 'Quản lý nghỉ phép'}</h1><p>Gửi đơn nghỉ và theo dõi quy trình phê duyệt theo vai trò.</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="split">
      <div className="panel"><h2>Gửi đơn nghỉ</h2><form className="form-grid" onSubmit={create}>
        {createForOthers ? <label>Nhân viên<select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required><option value="">-- Chọn nhân viên --</option>{employees.map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label> : <div className="self-info">Nhân viên: <b>{me?.full_name || 'Chưa liên kết'}</b></div>}
        <label>Loại nghỉ<select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>{Object.entries(leaveLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Từ ngày<input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></label>
        <label>Đến ngày<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></label>
        <label>Lý do<textarea maxLength={1000} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
        <button className="primary">Gửi đơn</button>
      </form></div>
      <div className="panel grow"><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Loại</th><th>Từ ngày</th><th>Đến ngày</th><th>Lý do</th><th>Trạng thái</th>{canApprove && <th></th>}</tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{empName(x.employee_id)}</td><td>{leaveLabel[x.leave_type] || x.leave_type}</td><td>{x.start_date}</td><td>{x.end_date}</td><td>{x.reason || '-'}</td><td><span className={x.status === 'APPROVED' ? 'badge' : x.status === 'REJECTED' ? 'badge badge-off' : 'badge badge-wait'}>{statusLabel[x.status] || x.status}</span></td>{canApprove && <td>{x.status === 'PENDING' && <div className="actions"><button onClick={() => decide(x.id, 'APPROVED')}>Duyệt</button><button className="danger" onClick={() => decide(x.id, 'REJECTED')}>Từ chối</button></div>}</td>}</tr>)}</tbody></table></div></div>
    </div>
  </section>
}

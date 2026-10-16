import { useEffect, useState } from 'react'
import { request } from '../api'
import { canManageReviews } from '../roles'

const blank = { employee_id: '', period: '', score: 8, strengths: '', improvements: '', reviewer: '' }

export default function Reviews({ user }) {
  const role = user?.role
  const editable = canManageReviews(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [reviews, emps] = await Promise.all([request('/api/talent/reviews'), request('/api/hr/employees')])
      setItems(reviews); setEmployees(emps)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (!form.employee_id) return setError('Vui lòng chọn nhân viên')
    if (Number(form.score) < 0 || Number(form.score) > 10) return setError('Điểm đánh giá phải từ 0 đến 10')
    try {
      await request('/api/talent/reviews', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          employee_id: Number(form.employee_id), score: Number(form.score),
          strengths: form.strengths || null, improvements: form.improvements || null,
          reviewer: form.reviewer || user?.full_name || null,
        }),
      })
      setForm(blank); setMessage('Đã lưu đánh giá hiệu suất'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (user?.employee_id === id ? user.full_name : `#${id}`)
  const average = items.length ? (items.reduce((sum, x) => sum + Number(x.score || 0), 0) / items.length).toFixed(1) : '0.0'

  return <section>
    <div className="page-title"><div><span>ĐÁNH GIÁ</span><h1>{role === 'EMPLOYEE' ? 'Kết quả đánh giá của tôi' : role === 'MANAGER' ? 'Đánh giá nhân viên phòng ban' : 'Đánh giá hiệu suất'}</h1><p>{editable ? 'Ghi nhận kết quả công việc, điểm mạnh và nội dung cần cải thiện.' : 'Bạn chỉ được xem kết quả đánh giá thuộc hồ sơ của mình.'}</p></div></div>
    <div className="mini-stats"><div><span>Số đánh giá</span><b>{items.length}</b></div><div><span>Điểm trung bình</span><b>{average}/10</b></div><div><span>Phạm vi</span><b>{role === 'MANAGER' ? 'Phòng ban' : role === 'EMPLOYEE' ? 'Cá nhân' : 'Nhân sự'}</b></div><div><span>Vai trò</span><b>{user?.role_label || '-'}</b></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className={editable ? 'split' : 'work-grid single'}>
      {editable && <div className="panel form-panel"><div className="panel-heading"><div><span>ĐÁNH GIÁ MỚI</span><h2>Tạo đánh giá</h2></div></div><form className="form-grid" onSubmit={create}>
        <label>Nhân viên<select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required><option value="">-- Chọn nhân viên --</option>{employees.filter(x => x.status !== 'INACTIVE').map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label>
        <label>Kỳ đánh giá<input maxLength="50" placeholder="Ví dụ: Q4/2026" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required /></label>
        <label>Điểm (0-10)<input type="number" min="0" max="10" step="0.1" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required /></label>
        <label>Điểm mạnh<textarea maxLength="2000" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} /></label>
        <label>Cần cải thiện<textarea maxLength="2000" value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} /></label>
        <label>Người đánh giá<input maxLength="160" value={form.reviewer || user?.full_name || ''} onChange={e => setForm({ ...form, reviewer: e.target.value })} /></label>
        <button className="primary">Lưu đánh giá</button>
      </form></div>}
      <div className="panel grow data-panel"><div className="panel-heading"><div><span>LỊCH SỬ</span><h2>Kết quả đánh giá</h2></div><small>{role === 'MANAGER' ? `Phạm vi ${user?.department_name || 'phòng ban của bạn'}` : role === 'EMPLOYEE' ? 'Chỉ dữ liệu cá nhân' : 'Theo phạm vi quyền hiện tại'}</small></div><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Kỳ</th><th>Điểm</th><th>Điểm mạnh</th><th>Cần cải thiện</th><th>Người đánh giá</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td><b>{empName(x.employee_id)}</b></td><td>{x.period}</td><td><span className="score-badge">{x.score}/10</span></td><td>{x.strengths || '-'}</td><td>{x.improvements || '-'}</td><td>{x.reviewer || '-'}</td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

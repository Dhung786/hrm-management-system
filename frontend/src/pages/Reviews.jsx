import { useEffect, useMemo, useState } from 'react'
import { Award, GaugeCircle, Plus, Search, Star, UsersRound } from 'lucide-react'
import { request } from '../api'
import { canManageReviews } from '../roles'

const blank = { employee_id: '', period: '', score: 8, strengths: '', improvements: '', reviewer: '' }

export default function Reviews({ user }) {
  const role = user?.role
  const editable = canManageReviews(role)
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState(blank)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [scoreFilter, setScoreFilter] = useState('ALL')
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
        body: JSON.stringify({ ...form, employee_id: Number(form.employee_id), score: Number(form.score), strengths: form.strengths || null, improvements: form.improvements || null, reviewer: form.reviewer || user?.full_name || null }),
      })
      setForm(blank); setShowCreate(false); setMessage('Đã lưu đánh giá hiệu suất'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || (user?.employee_id === id ? user.full_name : `#${id}`)
  const periods = useMemo(() => [...new Set(items.map(x => x.period).filter(Boolean))], [items])
  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${empName(x.employee_id)} ${x.reviewer || ''} ${x.strengths || ''} ${x.improvements || ''}`.toLowerCase().includes(keyword)
    const matchesPeriod = periodFilter === 'ALL' || x.period === periodFilter
    const score = Number(x.score || 0)
    const matchesScore = scoreFilter === 'ALL' || (scoreFilter === 'HIGH' ? score >= 8 : scoreFilter === 'MID' ? score >= 5 && score < 8 : score < 5)
    return matchesText && matchesPeriod && matchesScore
  }), [items, query, periodFilter, scoreFilter, employees])

  const average = items.length ? (items.reduce((sum, x) => sum + Number(x.score || 0), 0) / items.length).toFixed(1) : '0.0'
  const highCount = items.filter(x => Number(x.score) >= 8).length
  const lowCount = items.filter(x => Number(x.score) < 5).length
  const title = role === 'EMPLOYEE' ? 'Kết quả đánh giá của tôi' : role === 'MANAGER' ? 'Đánh giá nhân viên phòng ban' : 'Đánh giá hiệu suất'

  return <section>
    <div className="page-title page-title-modern"><div><span>ĐÁNH GIÁ HIỆU SUẤT</span><h1>{title}</h1><p>{editable ? 'Ghi nhận kết quả công việc, điểm mạnh và nội dung cần cải thiện.' : 'Xem kết quả đánh giá thuộc hồ sơ của bạn.'}</p></div>{editable && <button className="primary page-primary-action" onClick={() => setShowCreate(true)}><Plus size={17}/> Tạo đánh giá</button>}</div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><UsersRound size={20}/></div><div><span>Số đánh giá</span><strong>{items.length}</strong><small>Tổng bản ghi đánh giá</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><Star size={20}/></div><div><span>Điểm trung bình</span><strong>{average}</strong><small>Trên thang điểm 10</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><Award size={20}/></div><div><span>Hiệu suất tốt</span><strong>{highCount}</strong><small>Điểm từ 8 trở lên</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><GaugeCircle size={20}/></div><div><span>Cần cải thiện</span><strong>{lowCount}</strong><small>Điểm dưới 5</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel"><div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm nhân viên, người đánh giá, nội dung..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}><option value="ALL">Tất cả kỳ đánh giá</option>{periods.map(x => <option key={x} value={x}>{x}</option>)}</select><select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}><option value="ALL">Tất cả mức điểm</option><option value="HIGH">Tốt (8-10)</option><option value="MID">Trung bình (5-7.9)</option><option value="LOW">Cần cải thiện (&lt;5)</option></select></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Nhân viên</th><th>Kỳ</th><th>Điểm</th><th>Điểm mạnh</th><th>Cần cải thiện</th><th>Người đánh giá</th></tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{empName(x.employee_id)}</b></td><td>{x.period}</td><td><span className={Number(x.score) >= 8 ? 'badge' : Number(x.score) < 5 ? 'badge badge-off' : 'badge badge-wait'}>{x.score}/10</span></td><td>{x.strengths || '-'}</td><td>{x.improvements || '-'}</td><td>{x.reviewer || '-'}</td></tr>)}</tbody></table></div><div className="table-footer">Hiển thị {filteredItems.length} / {items.length} đánh giá</div></div>

    {showCreate && editable && <div className="modal-backdrop"><form className="modal-card" onSubmit={create}><div className="modal-head"><div><span>ĐÁNH GIÁ</span><h2>Tạo đánh giá hiệu suất</h2></div><button type="button" onClick={() => setShowCreate(false)}>✕</button></div><label>Nhân viên<select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required><option value="">-- Chọn nhân viên --</option>{employees.filter(x => x.status !== 'INACTIVE').map(x => <option key={x.id} value={x.id}>{x.employee_code} - {x.full_name}</option>)}</select></label><div className="form-grid two-col-form"><label>Kỳ đánh giá<input maxLength="50" placeholder="Ví dụ: Q4/2026" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} required /></label><label>Điểm (0-10)<input type="number" min="0" max="10" step="0.1" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required /></label></div><label>Điểm mạnh<textarea maxLength="2000" value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} /></label><label>Cần cải thiện<textarea maxLength="2000" value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} /></label><label>Người đánh giá<input maxLength="160" value={form.reviewer || user?.full_name || ''} onChange={e => setForm({ ...form, reviewer: e.target.value })} /></label><div className="actions"><button type="button" onClick={() => setShowCreate(false)}>Hủy</button><button className="primary">Lưu đánh giá</button></div></form></div>}
  </section>
}

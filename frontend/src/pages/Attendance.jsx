import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, LogIn, LogOut, Search } from 'lucide-react'
import { request } from '../api'

const statusLabel = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng', REMOTE: 'Làm từ xa', LEAVE: 'Nghỉ phép' }

export default function Attendance({ user }) {
  const role = user?.role
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [attendance, emps] = await Promise.all([request('/api/attendance'), request('/api/hr/employees')])
      setItems(attendance); setEmployees(emps)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const act = async (path) => {
    setError(''); setMessage('')
    try {
      const data = await request(path, { method: 'POST' })
      setMessage(data.message || 'Thao tác thành công'); await load()
    } catch (e) { setError(e.message) }
  }

  const empName = id => employees.find(x => x.id === id)?.full_name || `#${id}`
  const today = new Date().toISOString().slice(0, 10)
  const todayItems = useMemo(() => items.filter(x => x.work_date === today), [items, today])
  const present = todayItems.filter(x => ['PRESENT', 'LATE', 'REMOTE'].includes(x.status)).length
  const late = todayItems.filter(x => x.status === 'LATE').length
  const missingCheckout = todayItems.filter(x => x.check_in && !x.check_out).length
  const dates = useMemo(() => [...new Set(items.map(x => x.work_date))].sort().reverse(), [items])
  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${empName(x.employee_id)} ${x.note || ''}`.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter === 'ALL' || x.status === statusFilter
    const matchesDate = dateFilter === 'ALL' || x.work_date === dateFilter
    return matchesText && matchesStatus && matchesDate
  }), [items, query, statusFilter, dateFilter, employees])
  const title = role === 'EMPLOYEE' ? 'Chấm công của tôi' : role === 'MANAGER' ? 'Chấm công phòng ban' : role === 'PAYROLL' ? 'Đối soát chấm công' : 'Chấm công hằng ngày'

  return <section>
    <div className="page-title page-title-modern"><div><span>CHẤM CÔNG</span><h1>{title}</h1><p>Theo dõi giờ vào, giờ ra và trạng thái làm việc theo phạm vi quyền hiện tại.</p></div>{user?.employee_id && <div className="actions"><button onClick={() => act('/api/attendance/check-in')}><LogIn size={17}/> Check-in</button><button className="primary page-primary-action" onClick={() => act('/api/attendance/check-out')}><LogOut size={17}/> Check-out</button></div>}</div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><Clock3 size={20}/></div><div><span>Bản ghi hôm nay</span><strong>{todayItems.length}</strong><small>Dữ liệu ngày hiện tại</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><CheckCircle2 size={20}/></div><div><span>Có mặt</span><strong>{present}</strong><small>Có mặt, đi muộn hoặc làm từ xa</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><Clock3 size={20}/></div><div><span>Đi muộn</span><strong>{late}</strong><small>Bản ghi trạng thái đi muộn</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><LogOut size={20}/></div><div><span>Chưa check-out</span><strong>{missingCheckout}</strong><small>Đã vào nhưng chưa ghi giờ ra</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel"><div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm nhân viên hoặc ghi chú..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={dateFilter} onChange={e => setDateFilter(e.target.value)}><option value="ALL">Tất cả ngày</option>{dates.map(x => <option key={x} value={x}>{x}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Nhân viên</th><th>Ngày</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{empName(x.employee_id)}</b></td><td>{x.work_date}</td><td>{x.check_in ? new Date(x.check_in).toLocaleTimeString('vi-VN') : '-'}</td><td>{x.check_out ? new Date(x.check_out).toLocaleTimeString('vi-VN') : '-'}</td><td><span className={x.status === 'LATE' ? 'badge badge-wait' : x.status === 'ABSENT' ? 'badge badge-off' : 'badge'}>{statusLabel[x.status] || x.status}</span></td><td>{x.note || '-'}</td></tr>)}</tbody></table></div><div className="table-footer">Hiển thị {filteredItems.length} / {items.length} bản ghi chấm công</div></div>
  </section>
}

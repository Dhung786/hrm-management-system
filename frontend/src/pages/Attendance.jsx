import { useEffect, useMemo, useState } from 'react'
import { request } from '../api'

const statusLabel = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng', REMOTE: 'Làm từ xa', LEAVE: 'Nghỉ phép' }

export default function Attendance({ user }) {
  const role = user?.role
  const [items, setItems] = useState([])
  const [employees, setEmployees] = useState([])
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
  const title = role === 'EMPLOYEE' ? 'Chấm công của tôi' : role === 'MANAGER' ? 'Chấm công phòng ban' : role === 'PAYROLL' ? 'Đối soát chấm công' : 'Chấm công hằng ngày'
  const scope = role === 'MANAGER' ? `Nhân viên thuộc ${user?.department_name || 'phòng ban của bạn'}` : role === 'EMPLOYEE' ? 'Chỉ dữ liệu cá nhân' : role === 'PAYROLL' ? 'Dữ liệu phục vụ tính lương' : 'Phạm vi theo quyền tài khoản'

  return <section>
    <div className="page-title page-title-modern"><div><span>CHẤM CÔNG</span><h1>{title}</h1><p>Theo dõi giờ vào, giờ ra và trạng thái làm việc.</p></div>{user?.employee_id && <div className="actions"><button onClick={() => act('/api/attendance/check-in')}>Check-in</button><button className="primary" onClick={() => act('/api/attendance/check-out')}>Check-out</button></div>}</div>
    <div className="mini-stats"><div><span>Bản ghi hôm nay</span><b>{todayItems.length}</b></div><div><span>Có mặt</span><b>{present}</b></div><div><span>Đi muộn</span><b>{late}</b></div><div><span>Chưa check-out</span><b>{missingCheckout}</b></div></div>
    <div className="role-view-banner"><div><h3>{user?.role_label}</h3><p>{scope}</p></div><span className="role-pill">{items.length} bản ghi</span></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="panel data-panel"><div className="panel-heading"><div><span>LỊCH SỬ</span><h2>Dữ liệu chấm công</h2></div><small>Danh sách được giới hạn theo vai trò đăng nhập</small></div><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Ngày</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td><b>{empName(x.employee_id)}</b></td><td>{x.work_date}</td><td>{x.check_in ? new Date(x.check_in).toLocaleTimeString('vi-VN') : '-'}</td><td>{x.check_out ? new Date(x.check_out).toLocaleTimeString('vi-VN') : '-'}</td><td><span className={x.status === 'LATE' ? 'badge badge-wait' : x.status === 'ABSENT' ? 'badge badge-off' : 'badge'}>{statusLabel[x.status] || x.status}</span></td><td>{x.note || '-'}</td></tr>)}</tbody></table></div></div>
  </section>
}

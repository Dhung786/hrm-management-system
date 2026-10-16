import { useEffect, useState } from 'react'
import { request } from '../api'

const statusLabel = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng', REMOTE: 'Làm từ xa', LEAVE: 'Nghỉ phép' }

export default function Attendance() {
  const role = localStorage.getItem('role')
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

  return <section>
    <div className="page-title"><div><span>CHẤM CÔNG</span><h1>{role === 'EMPLOYEE' ? 'Chấm công của tôi' : role === 'MANAGER' ? 'Chấm công phòng ban' : 'Chấm công hằng ngày'}</h1><p>Check-in/check-out cá nhân và theo dõi dữ liệu theo phạm vi vai trò.</p></div><div className="actions"><button onClick={() => act('/api/attendance/check-in')}>Check-in</button><button className="primary" onClick={() => act('/api/attendance/check-out')}>Check-out</button></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="panel"><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Ngày</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{empName(x.employee_id)}</td><td>{x.work_date}</td><td>{x.check_in ? new Date(x.check_in).toLocaleTimeString('vi-VN') : '-'}</td><td>{x.check_out ? new Date(x.check_out).toLocaleTimeString('vi-VN') : '-'}</td><td><span className="badge">{statusLabel[x.status] || x.status}</span></td><td>{x.note || '-'}</td></tr>)}</tbody></table></div></div>
  </section>
}

import { useEffect, useState } from 'react'
import { request } from '../api'

export default function Dashboard() {
  const [d, setD] = useState({})
  useEffect(() => { request('/api/dashboard').then(setD).catch(() => {}) }, [])

  const cards = [
    ['Nhân viên đang làm', d.active_employees || 0],
    ['Phòng ban trong phạm vi', d.departments || 0],
    ['Có mặt hôm nay', d.present_today || 0],
    ['Đơn nghỉ chờ duyệt', d.pending_leave || 0],
  ]

  const features = [
    'Hồ sơ nhân viên, phòng ban và chức vụ',
    'Chấm công check-in/check-out',
    'Nghỉ phép và phê duyệt theo cấp quản lý',
    'Bảng lương theo tháng',
    'Hợp đồng lao động',
    'Đánh giá hiệu suất',
    'Tin tuyển dụng và ứng viên',
    '5 vai trò: Quản trị hệ thống, Nhân sự, Trưởng phòng, Kế toán tiền lương, Nhân viên',
  ]

  return <section>
    <div className="page-title"><div><span>TỔNG QUAN</span><h1>Dashboard nhân sự</h1><p>Dữ liệu hiển thị theo phạm vi quyền của tài khoản đang đăng nhập.</p></div><div className="role-pill">{d.role_label || 'Đang tải vai trò...'}</div></div>
    <div className="stats">{cards.map(([a, b]) => <div className="stat" key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
    <div className="panel"><h2>Chức năng hệ thống</h2><div className="feature-grid">{features.map(x => <div className="feature" key={x}>{x}</div>)}</div></div>
  </section>
}

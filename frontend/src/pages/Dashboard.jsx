import { useEffect, useMemo, useState } from 'react'
import { request } from '../api'

const ROLE_FEATURES = {
  ADMIN: [
    'Quản lý tài khoản và phân quyền',
    'Quản lý toàn bộ nhân sự và cơ cấu tổ chức',
    'Kiểm tra chấm công, nghỉ phép, hợp đồng và lương',
    'Theo dõi tuyển dụng, đánh giá và giám sát hệ thống',
  ],
  HR: [
    'Quản lý hồ sơ nhân viên',
    'Quản lý phòng ban và chức vụ',
    'Theo dõi chấm công và xử lý nghỉ phép',
    'Quản lý hợp đồng, tuyển dụng và đánh giá hiệu suất',
  ],
  MANAGER: [
    'Theo dõi nhân viên thuộc phòng ban phụ trách',
    'Theo dõi chấm công của phòng',
    'Duyệt hoặc từ chối đơn nghỉ thuộc phạm vi quản lý',
    'Đánh giá hiệu suất nhân viên trong phòng',
  ],
  PAYROLL: [
    'Đối soát dữ liệu chấm công phục vụ tính lương',
    'Lập và quản lý bảng lương',
    'Kiểm tra thông tin hợp đồng liên quan đến tiền lương',
    'Theo dõi hồ sơ cá nhân của chính mình',
  ],
  EMPLOYEE: [
    'Chấm công và xem lịch sử chấm công của bản thân',
    'Tạo và theo dõi đơn nghỉ phép',
    'Xem bảng lương và hợp đồng của bản thân',
    'Xem kết quả đánh giá và cập nhật hồ sơ cá nhân',
  ],
}

export default function Dashboard({ user }) {
  const [d, setD] = useState({})
  useEffect(() => { request('/api/dashboard').then(setD).catch(() => {}) }, [user?.role])

  const cards = useMemo(() => {
    if (user?.role === 'EMPLOYEE') {
      return [
        ['Phạm vi dữ liệu', 'Cá nhân'],
        ['Chấm công hôm nay', d.present_today ? 'Đã ghi nhận' : 'Chưa ghi nhận'],
        ['Đơn nghỉ đang chờ', d.pending_leave || 0],
        ['Vai trò', user.role_label || 'Nhân viên'],
      ]
    }
    return [
      ['Nhân viên đang làm', d.active_employees || 0],
      ['Phòng ban trong phạm vi', d.departments || 0],
      ['Có mặt hôm nay', d.present_today || 0],
      ['Đơn nghỉ chờ duyệt', d.pending_leave || 0],
    ]
  }, [d, user])

  const features = ROLE_FEATURES[user?.role] || []

  return <section>
    <div className="page-title">
      <div>
        <span>TỔNG QUAN</span>
        <h1>Không gian làm việc của {user?.role_label || 'người dùng'}</h1>
        <p>Chỉ hiển thị các chức năng và dữ liệu thuộc phạm vi công việc của tài khoản đang đăng nhập.</p>
      </div>
      <div className="role-pill">{user?.role_label || d.role_label || 'Đang tải vai trò...'}</div>
    </div>
    <div className="stats">{cards.map(([a, b]) => <div className="stat" key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
    <div className="panel">
      <h2>Công việc thuộc vai trò của bạn</h2>
      <div className="feature-grid">{features.map(x => <div className="feature" key={x}>{x}</div>)}</div>
    </div>
  </section>
}

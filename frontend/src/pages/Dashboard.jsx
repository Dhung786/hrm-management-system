import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react'
import { request } from '../api'

const ROLE_ACTIONS = {
  ADMIN: [
    ['employees', 'Nhân viên', 'Quản lý hồ sơ và trạng thái làm việc', Users],
    ['organization', 'Cơ cấu tổ chức', 'Phòng ban và chức vụ', Building2],
    ['accounts', 'Tài khoản & phân quyền', 'Tạo tài khoản và gán vai trò', ShieldCheck],
    ['payroll', 'Tiền lương', 'Theo dõi và kiểm tra bảng lương', WalletCards],
    ['recruitment', 'Tuyển dụng', 'Tin tuyển dụng và ứng viên', BriefcaseBusiness],
    ['profile', 'Hồ sơ của tôi', 'Thông tin tài khoản đang đăng nhập', UserRound],
  ],
  HR: [
    ['employees', 'Nhân viên', 'Hồ sơ, liên hệ và trạng thái', Users],
    ['organization', 'Phòng ban & chức vụ', 'Cơ cấu tổ chức doanh nghiệp', Building2],
    ['leaves', 'Nghỉ phép', 'Theo dõi và xử lý đơn nghỉ', CalendarDays],
    ['contracts', 'Hợp đồng', 'Quản lý hợp đồng lao động', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Ghi nhận kết quả làm việc', Star],
    ['recruitment', 'Tuyển dụng', 'Theo dõi vị trí và ứng viên', BriefcaseBusiness],
  ],
  MANAGER: [
    ['employees', 'Nhân viên phòng tôi', 'Xem nhân viên thuộc phòng phụ trách', Users],
    ['attendance', 'Chấm công phòng', 'Theo dõi giờ vào/ra của nhân viên', Clock3],
    ['leaves', 'Duyệt nghỉ phép', 'Duyệt hoặc từ chối đơn nghỉ', CalendarDays],
    ['reviews', 'Đánh giá hiệu suất', 'Đánh giá nhân viên trong phòng', Star],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
  ],
  PAYROLL: [
    ['attendance', 'Đối soát chấm công', 'Dữ liệu phục vụ tính lương', Clock3],
    ['payroll', 'Bảng lương', 'Lương, phụ cấp, thưởng và khấu trừ', WalletCards],
    ['contracts', 'Hợp đồng', 'Kiểm tra thông tin lương theo hợp đồng', FileText],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
  ],
  EMPLOYEE: [
    ['attendance', 'Chấm công', 'Check-in, check-out và lịch sử cá nhân', Clock3],
    ['leaves', 'Nghỉ phép', 'Gửi và theo dõi đơn nghỉ', CalendarDays],
    ['payroll', 'Phiếu lương', 'Xem bảng lương của bản thân', WalletCards],
    ['contracts', 'Hợp đồng', 'Xem hợp đồng lao động của bản thân', FileText],
    ['reviews', 'Đánh giá', 'Xem kết quả đánh giá hiệu suất', Star],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và đổi mật khẩu', UserRound],
  ],
}

export default function Dashboard({ user, onNavigate }) {
  const [d, setD] = useState({})
  useEffect(() => { request('/api/dashboard').then(setD).catch(() => {}) }, [user?.role])

  const cards = useMemo(() => {
    if (user?.role === 'EMPLOYEE') {
      return [
        ['Phạm vi dữ liệu', 'Cá nhân', 'Chỉ dữ liệu của bạn'],
        ['Chấm công hôm nay', d.present_today ? 'Đã ghi nhận' : 'Chưa ghi nhận', 'Trạng thái hiện tại'],
        ['Đơn nghỉ đang chờ', d.pending_leave || 0, 'Đơn chưa được xử lý'],
        ['Vai trò', user.role_label || 'Nhân viên', 'Quyền truy cập hiện tại'],
      ]
    }
    return [
      ['Nhân viên đang làm', d.active_employees || 0, 'Trong phạm vi được phép'],
      ['Phòng ban', d.departments || 0, 'Phòng ban trong phạm vi'],
      ['Có mặt hôm nay', d.present_today || 0, 'Đã ghi nhận chấm công'],
      ['Đơn nghỉ chờ duyệt', d.pending_leave || 0, 'Cần được xử lý'],
    ]
  }, [d, user])

  const actions = ROLE_ACTIONS[user?.role] || []

  return <section className="workspace-section">
    <div className="workspace-heading">
      <div>
        <span className="eyebrow">TỔNG QUAN</span>
        <h1>{user?.role_label || 'Người dùng'}</h1>
        <p>Chào {user?.full_name || user?.email}. Đây là các chức năng đúng với phạm vi công việc của bạn.</p>
      </div>
      <div className="workspace-badge"><span className="status-dot"/> {user?.role_label}</div>
    </div>

    <div className="dashboard-stats">
      {cards.map(([label, value, note], index) => <div className="dashboard-stat" key={label}>
        <div className={`stat-icon stat-icon-${index + 1}`}>{index + 1}</div>
        <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
      </div>)}
    </div>

    <div className="workspace-panel">
      <div className="workspace-panel-heading">
        <div><span className="eyebrow">CHỨC NĂNG</span><h2>Công việc của bạn</h2></div>
        <small>Chỉ hiển thị chức năng thuộc vai trò hiện tại</small>
      </div>
      <div className="workspace-actions">
        {actions.map(([target, title, note, Icon]) => <button type="button" className="workspace-action" key={target} onClick={() => onNavigate?.(target)}>
          <span className="workspace-action-icon"><Icon size={21}/></span>
          <span><b>{title}</b><small>{note}</small></span>
          <span className="workspace-action-arrow">→</span>
        </button>)}
      </div>
    </div>
  </section>
}

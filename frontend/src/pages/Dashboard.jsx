import { useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Gauge,
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
    ['organization', 'Phòng ban & chức vụ', 'Quản lý cơ cấu tổ chức', Building2],
    ['attendance', 'Chấm công', 'Theo dõi dữ liệu chấm công toàn hệ thống', Clock3],
    ['leaves', 'Nghỉ phép', 'Theo dõi và xử lý đơn nghỉ', CalendarDays],
    ['payroll', 'Tiền lương', 'Theo dõi bảng lương và trạng thái chi trả', WalletCards],
    ['contracts', 'Hợp đồng', 'Theo dõi và quản lý hợp đồng lao động', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Theo dõi kết quả đánh giá nhân viên', Star],
    ['recruitment', 'Tuyển dụng', 'Theo dõi tin tuyển dụng và ứng viên', BriefcaseBusiness],
    ['accounts', 'Tài khoản & phân quyền', 'Tạo tài khoản, gán vai trò và khóa đăng nhập', ShieldCheck],
    ['system', 'Giám sát hệ thống', 'Theo dõi tình trạng dịch vụ và hạ tầng', Gauge],
    ['profile', 'Hồ sơ của tôi', 'Thông tin tài khoản quản trị', UserRound],
  ],
  HR: [
    ['employees', 'Nhân viên', 'Hồ sơ, liên hệ và trạng thái làm việc', Users],
    ['organization', 'Phòng ban & chức vụ', 'Cơ cấu tổ chức doanh nghiệp', Building2],
    ['attendance', 'Chấm công', 'Theo dõi dữ liệu chấm công nhân sự', Clock3],
    ['leaves', 'Nghỉ phép', 'Theo dõi và xử lý đơn nghỉ', CalendarDays],
    ['contracts', 'Hợp đồng', 'Quản lý hợp đồng lao động', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Ghi nhận kết quả làm việc', Star],
    ['recruitment', 'Tuyển dụng', 'Theo dõi vị trí và ứng viên', BriefcaseBusiness],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
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
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    request('/api/dashboard').then(setD).catch(() => {})
    if (user?.role === 'ADMIN') request('/api/accounts').then(setAccounts).catch(() => setAccounts([]))
    else setAccounts([])
  }, [user?.role])

  const cards = useMemo(() => {
    if (user?.role === 'ADMIN') {
      const locked = accounts.filter(x => !x.is_active).length
      const activeAccounts = accounts.filter(x => x.is_active).length
      return [
        ['Nhân viên đang làm', d.active_employees || 0, 'Hồ sơ nhân sự đang hoạt động'],
        ['Phòng ban', d.departments || 0, 'Cơ cấu tổ chức hiện tại'],
        ['Tài khoản bị khóa', locked, locked ? 'Cần kiểm tra nếu khóa ngoài dự kiến' : 'Không có tài khoản cần chú ý'],
        ['Tài khoản hoạt động', activeAccounts, 'Được phép đăng nhập hệ thống'],
      ]
    }

    if (user?.role === 'HR') {
      return [
        ['Nhân viên đang làm', d.active_employees || 0, 'Nhân sự đang hoạt động'],
        ['Phòng ban', d.departments || 0, 'Đơn vị đang quản lý'],
        ['Đơn nghỉ chờ duyệt', d.pending_leave || 0, 'Cần Nhân sự kiểm tra và xử lý'],
        ['Có mặt hôm nay', d.present_today || 0, 'Đã ghi nhận chấm công'],
      ]
    }

    if (user?.role === 'MANAGER') {
      return [
        ['Nhân viên phòng tôi', d.active_employees || 0, 'Trong phòng ban phụ trách'],
        ['Có mặt hôm nay', d.present_today || 0, 'Nhân viên đã check-in'],
        ['Đơn nghỉ chờ duyệt', d.pending_leave || 0, 'Cần Trưởng phòng xử lý'],
        ['Phạm vi', user?.department_name || 'Phòng của tôi', 'Chỉ dữ liệu thuộc phòng phụ trách'],
      ]
    }

    if (user?.role === 'PAYROLL') {
      const missingAttendance = Math.max(0, Number(d.active_employees || 0) - Number(d.present_today || 0))
      return [
        ['Nhân viên đang làm', d.active_employees || 0, 'Phạm vi phục vụ tính lương'],
        ['Đã chấm công hôm nay', d.present_today || 0, 'Dữ liệu đã ghi nhận'],
        ['Chưa ghi nhận hôm nay', missingAttendance, 'Cần đối soát trước khi tính lương'],
        ['Vai trò', user.role_label || 'Kế toán tiền lương', 'Quyền truy cập hiện tại'],
      ]
    }

    return [
      ['Phạm vi dữ liệu', 'Cá nhân', 'Chỉ dữ liệu của bạn'],
      ['Chấm công hôm nay', d.present_today ? 'Đã ghi nhận' : 'Chưa ghi nhận', 'Trạng thái hiện tại'],
      ['Đơn nghỉ đang chờ', d.pending_leave || 0, 'Đơn chưa được xử lý'],
      ['Vai trò', user?.role_label || 'Nhân viên', 'Quyền truy cập hiện tại'],
    ]
  }, [d, user, accounts])

  const actions = ROLE_ACTIONS[user?.role] || []

  return <section className="workspace-section">
    <div className="workspace-heading">
      <div>
        <span className="eyebrow">TỔNG QUAN</span>
        <h1>{user?.role_label || 'Người dùng'}</h1>
        <p>Chào {user?.full_name || user?.email}. Các chỉ số và chức năng bên dưới được hiển thị đúng theo công việc của vai trò hiện tại.</p>
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
        <small>Chỉ hiển thị những chức năng thực tế mà vai trò này được sử dụng</small>
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

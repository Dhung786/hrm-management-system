import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
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
    ['employees', 'Nhân viên', 'Thêm, sửa, theo dõi hồ sơ và trạng thái làm việc', Users],
    ['organization', 'Phòng ban & chức vụ', 'Quản lý cơ cấu tổ chức doanh nghiệp', Building2],
    ['attendance', 'Chấm công', 'Xem dữ liệu giờ vào/ra của nhân sự', Clock3],
    ['leaves', 'Nghỉ phép', 'Tạo, duyệt hoặc từ chối đơn nghỉ', CalendarDays],
    ['contracts', 'Hợp đồng', 'Tạo hợp đồng và cập nhật trạng thái', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Tạo và theo dõi kết quả đánh giá', Star],
    ['recruitment', 'Tuyển dụng', 'Quản lý tin tuyển dụng và ứng viên', BriefcaseBusiness],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
  ],
  MANAGER: [
    ['employees', 'Nhân viên', 'Chỉ xem nhân viên thuộc phòng phụ trách', Users],
    ['attendance', 'Chấm công', 'Theo dõi giờ vào/ra của nhân viên trong phòng', Clock3],
    ['leaves', 'Nghỉ phép', 'Duyệt hoặc từ chối đơn nghỉ của nhân viên trong phòng', CalendarDays],
    ['contracts', 'Hợp đồng', 'Chỉ xem hợp đồng của nhân viên thuộc phòng', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Tạo đánh giá cho nhân viên trong phòng', Star],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
  ],
  PAYROLL: [
    ['attendance', 'Chấm công', 'Xem dữ liệu giờ công phục vụ tính lương', Clock3],
    ['payroll', 'Tiền lương', 'Lập bảng lương, phụ cấp, thưởng, khấu trừ và trạng thái chi trả', WalletCards],
    ['contracts', 'Hợp đồng', 'Chỉ xem thông tin hợp đồng và mức lương liên quan', FileText],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và tài khoản', UserRound],
  ],
  EMPLOYEE: [
    ['attendance', 'Chấm công', 'Check-in, check-out và xem lịch sử cá nhân', Clock3],
    ['leaves', 'Nghỉ phép', 'Gửi và theo dõi đơn nghỉ của bản thân', CalendarDays],
    ['payroll', 'Tiền lương', 'Chỉ xem bảng lương của bản thân', WalletCards],
    ['contracts', 'Hợp đồng', 'Chỉ xem hợp đồng lao động của bản thân', FileText],
    ['reviews', 'Đánh giá hiệu suất', 'Chỉ xem kết quả đánh giá hiệu suất của bản thân', Star],
    ['profile', 'Hồ sơ của tôi', 'Thông tin cá nhân và đổi mật khẩu', UserRound],
  ],
}

const numberOf = value => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
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
        { label: 'Nhân viên đang làm', value: d.active_employees || 0, note: 'Hồ sơ nhân sự đang hoạt động', Icon: Users, tone: 'red' },
        { label: 'Phòng ban', value: d.departments || 0, note: 'Cơ cấu tổ chức hiện tại', Icon: Building2, tone: 'orange' },
        { label: 'Tài khoản bị khóa', value: locked, note: locked ? 'Cần kiểm tra nếu khóa ngoài dự kiến' : 'Không có tài khoản cần chú ý', Icon: ShieldCheck, tone: 'yellow' },
        { label: 'Tài khoản hoạt động', value: activeAccounts, note: 'Được phép đăng nhập hệ thống', Icon: UserRound, tone: 'blue' },
      ]
    }

    if (user?.role === 'HR') {
      return [
        { label: 'Nhân viên đang làm', value: d.active_employees || 0, note: 'Nhân sự đang hoạt động', Icon: Users, tone: 'red' },
        { label: 'Phòng ban', value: d.departments || 0, note: 'Đơn vị đang quản lý', Icon: Building2, tone: 'orange' },
        { label: 'Đơn nghỉ chờ duyệt', value: d.pending_leave || 0, note: 'Cần Nhân sự kiểm tra và xử lý', Icon: CalendarDays, tone: 'yellow' },
        { label: 'Có mặt hôm nay', value: d.present_today || 0, note: 'Đã ghi nhận chấm công', Icon: Clock3, tone: 'blue' },
      ]
    }

    if (user?.role === 'MANAGER') {
      return [
        { label: 'Nhân viên phòng tôi', value: d.active_employees || 0, note: 'Trong phòng ban phụ trách', Icon: Users, tone: 'red' },
        { label: 'Có mặt hôm nay', value: d.present_today || 0, note: 'Nhân viên trong phòng đã check-in', Icon: Clock3, tone: 'orange' },
        { label: 'Đơn nghỉ chờ duyệt', value: d.pending_leave || 0, note: 'Cần Trưởng phòng xử lý', Icon: CalendarDays, tone: 'yellow' },
        { label: 'Phạm vi', value: user?.department_name || 'Phòng của tôi', note: 'Chỉ dữ liệu thuộc phòng phụ trách', Icon: Building2, tone: 'blue' },
      ]
    }

    if (user?.role === 'PAYROLL') {
      const missingAttendance = Math.max(0, numberOf(d.active_employees) - numberOf(d.present_today))
      return [
        { label: 'Nhân viên đang làm', value: d.active_employees || 0, note: 'Phạm vi phục vụ tính lương', Icon: Users, tone: 'red' },
        { label: 'Đã chấm công hôm nay', value: d.present_today || 0, note: 'Dữ liệu đã ghi nhận', Icon: Clock3, tone: 'orange' },
        { label: 'Chưa ghi nhận hôm nay', value: missingAttendance, note: 'Cần đối soát trước khi tính lương', Icon: CalendarDays, tone: 'yellow' },
        { label: 'Vai trò', value: user.role_label || 'Kế toán tiền lương', note: 'Quyền truy cập hiện tại', Icon: WalletCards, tone: 'blue' },
      ]
    }

    return [
      { label: 'Phạm vi dữ liệu', value: 'Cá nhân', note: 'Chỉ dữ liệu của bạn', Icon: UserRound, tone: 'red' },
      { label: 'Chấm công hôm nay', value: d.present_today ? 'Đã ghi nhận' : 'Chưa ghi nhận', note: 'Trạng thái hiện tại', Icon: Clock3, tone: 'orange' },
      { label: 'Đơn nghỉ đang chờ', value: d.pending_leave || 0, note: 'Đơn chưa được xử lý', Icon: CalendarDays, tone: 'yellow' },
      { label: 'Vai trò', value: user?.role_label || 'Nhân viên', note: 'Quyền truy cập hiện tại', Icon: ShieldCheck, tone: 'blue' },
    ]
  }, [d, user, accounts])

  const actions = ROLE_ACTIONS[user?.role] || []
  const quickActions = actions.slice(0, 4)
  const numericCards = cards.filter(card => Number.isFinite(Number(card.value)))
  const maxCardValue = Math.max(1, ...numericCards.map(card => numberOf(card.value)))

  const activeEmployees = numberOf(d.active_employees)
  const presentToday = Math.min(activeEmployees, numberOf(d.present_today))
  const notRecorded = Math.max(0, activeEmployees - presentToday)
  const presentPercent = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0

  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date())

  return <section className="workspace-section overview-page">
    <div className="overview-heading">
      <div>
        <h1>Tổng quan</h1>
        <p>Tổng quan tình hình nhân sự và hoạt động hệ thống</p>
      </div>
      <div className="overview-date-card">
        <CalendarDays size={18}/>
        <div><b>{today}</b><span>{user?.role_label || 'Người dùng hệ thống'}</span></div>
      </div>
    </div>

    <div className="overview-stat-grid">
      {cards.map(({ label, value, note, Icon, tone }) => <div className={`overview-stat-card tone-${tone}`} key={label}>
        <div className="overview-stat-icon"><Icon size={22}/></div>
        <div className="overview-stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
        <Icon className="overview-stat-watermark" size={50}/>
      </div>)}
    </div>

    <div className="overview-main-grid">
      <div className="overview-panel overview-chart-panel">
        <div className="overview-panel-head">
          <div><h2>Tổng hợp chỉ số</h2><span>Dữ liệu hiện có của vai trò {user?.role_label}</span></div>
        </div>
        <div className="overview-bar-chart">
          {numericCards.map((card, index) => {
            const height = Math.max(12, Math.round((numberOf(card.value) / maxCardValue) * 100))
            return <div className="overview-bar-item" key={card.label}>
              <div className="overview-bar-value">{card.value}</div>
              <div className="overview-bar-track"><div className={`overview-bar-fill bar-${index + 1}`} style={{ height: `${height}%` }}/></div>
              <div className="overview-bar-label">{card.label}</div>
            </div>
          })}
        </div>
      </div>

      <div className="overview-panel overview-quick-panel">
        <div className="overview-panel-head"><h2>Thao tác nhanh</h2></div>
        <div className="overview-quick-grid">
          {quickActions.map(([target, title, note, Icon], index) => <button type="button" className={`overview-quick-action quick-${index + 1}`} key={target} onClick={() => onNavigate?.(target)}>
            <span className="overview-quick-icon"><Icon size={21}/></span>
            <span><b>{title}</b><small>{note}</small></span>
            <ArrowRight size={17}/>
          </button>)}
        </div>
      </div>
    </div>

    <div className="overview-bottom-grid">
      <div className="overview-panel overview-access-panel">
        <div className="overview-panel-head">
          <div><h2>Chức năng được phân quyền</h2><span>Các mục bạn có thể truy cập trong hệ thống</span></div>
        </div>
        <div className="overview-access-list">
          {actions.slice(0, 6).map(([target, title, note, Icon]) => <button type="button" className="overview-access-row" key={target} onClick={() => onNavigate?.(target)}>
            <span className="overview-access-icon"><Icon size={17}/></span>
            <span className="overview-access-title">{title}</span>
            <span className="overview-access-note">{note}</span>
            <ArrowRight size={16}/>
          </button>)}
        </div>
      </div>

      <div className="overview-panel overview-attendance-panel">
        <div className="overview-panel-head">
          <div><h2>Tình hình chấm công</h2><span>Dữ liệu hôm nay</span></div>
        </div>
        <div className="overview-donut-wrap">
          <div className="overview-donut" style={{ '--present': `${presentPercent}%` }}>
            <div className="overview-donut-center"><strong>{activeEmployees}</strong><span>nhân viên</span></div>
          </div>
          <div className="overview-donut-legend">
            <div><i className="legend-present"/><span>Đã ghi nhận</span><b>{presentToday}</b></div>
            <div><i className="legend-missing"/><span>Chưa ghi nhận</span><b>{notRecorded}</b></div>
          </div>
        </div>
        <div className="overview-attendance-summary">
          <Clock3 size={19}/><div><b>{presentPercent}% đã ghi nhận chấm công</b><span>Dựa trên số nhân viên đang làm việc</span></div>
        </div>
      </div>
    </div>
  </section>
}

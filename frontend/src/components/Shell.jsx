import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Gauge,
  LogOut,
  Menu,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react'

const items = [
  ['dashboard', 'Tổng quan', BarChart3],
  ['employees', 'Nhân viên', Users],
  ['organization', 'Phòng ban & chức vụ', Building2],
  ['attendance', 'Chấm công', Clock3],
  ['leaves', 'Nghỉ phép', CalendarDays],
  ['payroll', 'Tiền lương', WalletCards],
  ['contracts', 'Hợp đồng', FileText],
  ['reviews', 'Đánh giá hiệu suất', Star],
  ['recruitment', 'Tuyển dụng', BriefcaseBusiness],
  ['accounts', 'Tài khoản & phân quyền', ShieldCheck],
  ['system', 'Giám sát hệ thống', Gauge],
  ['profile', 'Hồ sơ của tôi', UserRound],
]

const pageLabels = Object.fromEntries(items.map(([id, label]) => [id, label]))

const avatarRoleMeta = {
  ADMIN: { short: 'QT', className: 'role-admin' },
  HR: { short: 'NS', className: 'role-hr' },
  MANAGER: { short: 'TP', className: 'role-manager' },
  PAYROLL: { short: 'KT', className: 'role-payroll' },
  EMPLOYEE: { short: 'NV', className: 'role-employee' },
}

// Ảnh chân dung thật dùng cố định theo giới tính + vai trò để giao diện luôn nhất quán.
// Khi hệ thống có upload ảnh hồ sơ, chỉ cần ưu tiên user.avatar_url trước các URL này.
const avatarPortraits = {
  ADMIN: {
    MALE: 'https://randomuser.me/api/portraits/men/32.jpg',
    FEMALE: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  HR: {
    MALE: 'https://randomuser.me/api/portraits/men/46.jpg',
    FEMALE: 'https://randomuser.me/api/portraits/women/47.jpg',
  },
  MANAGER: {
    MALE: 'https://randomuser.me/api/portraits/men/11.jpg',
    FEMALE: 'https://randomuser.me/api/portraits/women/45.jpg',
  },
  PAYROLL: {
    MALE: 'https://randomuser.me/api/portraits/men/52.jpg',
    FEMALE: 'https://randomuser.me/api/portraits/women/36.jpg',
  },
  EMPLOYEE: {
    MALE: 'https://randomuser.me/api/portraits/men/75.jpg',
    FEMALE: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
}

function normalizedGender(value) {
  const gender = String(value || '').trim().toUpperCase()
  if (gender === 'MALE' || gender === 'FEMALE') return gender
  return 'OTHER'
}

function genderLabel(value) {
  const gender = normalizedGender(value)
  if (gender === 'MALE') return 'Nam'
  if (gender === 'FEMALE') return 'Nữ'
  return 'Chưa cập nhật giới tính'
}

function RoleAvatar({ user, small = false }) {
  const gender = normalizedGender(user.gender)
  const roleMeta = avatarRoleMeta[user.role] || { short: 'HR', className: 'role-default' }
  const title = `${user.full_name || user.email} · ${user.role_label} · ${genderLabel(user.gender)}`
  const portrait = avatarPortraits[user.role]?.[gender]
  const initials = (user.full_name || user.email || 'HR')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <div
      className={`role-avatar ${roleMeta.className} gender-${gender.toLowerCase()}${small ? ' role-avatar-small' : ''}`}
      title={title}
      aria-label={title}
    >
      {portrait ? (
        <img className="role-avatar-photo" src={portrait} alt="" aria-hidden="true" />
      ) : (
        <span className="role-avatar-fallback" aria-hidden="true">{initials || 'HR'}</span>
      )}
      <span className="role-avatar-badge">{roleMeta.short}</span>
    </div>
  )
}

export default function Shell({ page, setPage, children, onLogout, user, allowedPages }) {
  const visibleItems = items.filter(([id]) => allowedPages[id])
  const managementIds = new Set(['dashboard', 'employees', 'organization', 'attendance', 'leaves', 'payroll', 'contracts', 'reviews', 'recruitment'])
  const management = visibleItems.filter(([id]) => managementIds.has(id))
  const account = visibleItems.filter(([id]) => !managementIds.has(id))
  const workLabel = user.role === 'ADMIN' ? 'QUẢN TRỊ & NGHIỆP VỤ' : 'CÔNG VIỆC'
  const accountLabel = user.role === 'ADMIN' ? 'TÀI KHOẢN & HỆ THỐNG' : 'CÁ NHÂN'
  const currentLabel = pageLabels[page] || 'Không có quyền truy cập'

  const renderItem = ([id, label, Icon]) => (
    <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={() => setPage(id)} title={label}>
      <span className="nav-icon"><Icon size={18}/></span><span>{label}</span>
    </button>
  )

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">H</div>
        <div><b>HRM</b><span>MANAGEMENT</span></div>
      </div>

      <div className="sidebar-scroll">
        <div className="section-label">{workLabel}</div>
        {management.map(renderItem)}
        {account.length > 0 && <><div className="section-label">{accountLabel}</div>{account.map(renderItem)}</>}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <RoleAvatar user={user} small />
          <div className="sidebar-user-text">
            <b>{user.full_name || user.email}</b>
            <span>{user.role_label}</span>
          </div>
        </div>
        <button className="nav logout" onClick={onLogout}><LogOut size={18}/><span>Đăng xuất</span></button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="icon-button topbar-menu" type="button" aria-label="Menu"><Menu size={19}/></button>
        <div className="topbar-breadcrumb"><span>HRM</span><i>/</i><b>{currentLabel}</b></div>
        <div className="topbar-spacer" />
        <div className="api-status"><span className="api-dot"/>API Online</div>
        <button className="icon-button" type="button" title="Thông báo"><Bell size={18}/></button>
        <RoleAvatar user={user} />
      </header>
      {children}
    </main>
  </div>
}

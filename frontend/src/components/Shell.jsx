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

  return (
    <div
      className={`role-avatar ${roleMeta.className} gender-${gender.toLowerCase()}${small ? ' role-avatar-small' : ''}`}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        {gender === 'FEMALE' ? (
          <>
            <path className="avatar-hair" d="M14 31c0-13 7-22 18-22s18 9 18 22v14H14V31Z"/>
            <circle className="avatar-face" cx="32" cy="27" r="11"/>
            <path className="avatar-hair-front" d="M20 25c1-8 5-12 12-12 6 0 10 3 13 9-6-4-15-3-25 3Z"/>
            <path className="avatar-body" d="M12 61c2-13 9-19 20-19s18 6 20 19H12Z"/>
            <path className="avatar-shirt" d="M25 44l7 7 7-7 4 17H21l4-17Z"/>
          </>
        ) : gender === 'MALE' ? (
          <>
            <circle className="avatar-face" cx="32" cy="27" r="11"/>
            <path className="avatar-hair" d="M21 22c1-8 5-12 12-12 7 0 11 4 12 12-6-4-16-4-24 0Z"/>
            <path className="avatar-body" d="M12 61c2-13 9-19 20-19s18 6 20 19H12Z"/>
            <path className="avatar-shirt" d="M24 44l8 8 8-8 5 17H19l5-17Z"/>
            <path className="avatar-tie" d="M30 49h4l2 12h-8l2-12Z"/>
          </>
        ) : (
          <>
            <circle className="avatar-face" cx="32" cy="25" r="11"/>
            <path className="avatar-neutral-hair" d="M20 22c2-8 6-12 12-12s10 4 12 12c-7-3-17-3-24 0Z"/>
            <path className="avatar-body" d="M12 61c2-13 9-19 20-19s18 6 20 19H12Z"/>
            <path className="avatar-shirt" d="M24 44l8 7 8-7 4 17H20l4-17Z"/>
          </>
        )}
      </svg>
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

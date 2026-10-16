import {
  BarChart3,
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

export default function Shell({ page, setPage, children, onLogout, user, allowedPages }) {
  const visibleItems = items.filter(([id]) => allowedPages[id])
  const managementIds = new Set(['dashboard', 'employees', 'organization', 'attendance', 'leaves', 'payroll', 'contracts', 'reviews', 'recruitment'])
  const management = visibleItems.filter(([id]) => managementIds.has(id))
  const account = visibleItems.filter(([id]) => !managementIds.has(id))

  const renderItem = ([id, label, Icon]) => <button key={id} className={page === id ? 'nav active' : 'nav'} onClick={() => setPage(id)} title={label}><Icon size={18}/><span>{label}</span></button>

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">H</div><div><b>HRM</b><span>QUẢN LÝ NHÂN SỰ</span></div></div>
      <div className="sidebar-scroll">
        <div className="section-label">NGHIỆP VỤ</div>
        {management.map(renderItem)}
        {account.length > 0 && <><div className="section-label">TÀI KHOẢN & HỆ THỐNG</div>{account.map(renderItem)}</>}
      </div>
      <div className="sidebar-user">
        <div className="avatar">{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-text"><b>{user.full_name || user.email}</b><span>{user.role_label}</span></div>
      </div>
      <button className="nav logout" onClick={onLogout}><LogOut size={18}/><span>Đăng xuất</span></button>
    </aside>
    <main className="main">
      <header><Menu size={20}/><div className="header-copy"><b>Hệ thống quản lý nhân sự</b><span>{user.role_label}{user.department_name ? ` · ${user.department_name}` : ''}</span></div><div className="header-role"><span>Vai trò</span><b>{user.role_label}</b></div></header>
      {children}
    </main>
  </div>
}

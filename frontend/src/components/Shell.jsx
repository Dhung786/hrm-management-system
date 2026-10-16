import { BarChart3, BriefcaseBusiness, CalendarDays, Clock3, FileText, LogOut, Menu, Users, WalletCards } from 'lucide-react'

const items = [
  ['dashboard','Tổng quan',BarChart3],['employees','Nhân viên',Users],['attendance','Chấm công',Clock3],['leaves','Nghỉ phép',CalendarDays],['payroll','Tiền lương',WalletCards],['contracts','Hợp đồng',FileText],['recruitment','Tuyển dụng',BriefcaseBusiness]
]

export default function Shell({page,setPage,children,onLogout}){
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo">H</div><div><b>HRM</b><span>MANAGEMENT</span></div></div>
      <div className="section-label">QUẢN LÝ</div>
      {items.map(([id,label,Icon])=><button key={id} className={page===id?'nav active':'nav'} onClick={()=>setPage(id)}><Icon size={18}/><span>{label}</span></button>)}
      <button className="nav logout" onClick={onLogout}><LogOut size={18}/>Đăng xuất</button>
    </aside>
    <main className="main"><header><Menu size={20}/><div><b>Hệ thống quản lý nhân sự</b><span>Quản trị tập trung nhân viên, chấm công, lương và tuyển dụng</span></div></header>{children}</main>
  </div>
}

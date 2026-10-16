import { ExternalLink, Gauge, ShieldCheck, ServerCog } from 'lucide-react'

const services = [
  { title: 'pgAdmin', text: 'Quản trị PostgreSQL và kiểm tra dữ liệu HRM.', href: 'http://localhost:5050', icon: ServerCog },
  { title: 'Prometheus', text: 'Theo dõi target và metric của backend, Nginx, PostgreSQL, container.', href: 'http://localhost:9090', icon: Gauge },
  { title: 'Grafana', text: 'Dashboard giám sát và truy vấn log Loki/LogQL.', href: 'http://localhost:3000', icon: ShieldCheck },
]

export default function System() {
  return <section>
    <div className="page-title"><div><span>HỆ THỐNG</span><h1>Giám sát & vận hành</h1><p>Khu vực dành cho Quản trị hệ thống để kiểm tra hạ tầng và quan sát dịch vụ.</p></div></div>
    <div className="service-grid">{services.map(({ title, text, href, icon: Icon }) => <a className="service-card" href={href} target="_blank" rel="noreferrer" key={title}><Icon size={26}/><div><h3>{title}</h3><p>{text}</p></div><ExternalLink size={18}/></a>)}</div>
    <div className="panel"><h2>Phân quyền đang áp dụng</h2><div className="role-matrix">
      <div><b>Quản trị hệ thống</b><span>Toàn quyền, tài khoản, phân quyền, giám sát.</span></div>
      <div><b>Nhân sự</b><span>Nhân viên, cơ cấu tổ chức, hợp đồng, nghỉ phép, tuyển dụng.</span></div>
      <div><b>Trưởng phòng</b><span>Xem nhân viên phòng mình, chấm công, duyệt nghỉ, đánh giá.</span></div>
      <div><b>Kế toán tiền lương</b><span>Chấm công để đối soát và quản lý bảng lương.</span></div>
      <div><b>Nhân viên</b><span>Hồ sơ cá nhân, chấm công, nghỉ phép, lương, hợp đồng, đánh giá của mình.</span></div>
    </div></div>
  </section>
}

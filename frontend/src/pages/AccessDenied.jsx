import { ArrowLeft, Home, ShieldX } from 'lucide-react'

const PAGE_LABELS = {
  dashboard: 'Tổng quan',
  employees: 'Nhân viên',
  organization: 'Phòng ban & chức vụ',
  attendance: 'Chấm công',
  leaves: 'Nghỉ phép',
  payroll: 'Tiền lương',
  contracts: 'Hợp đồng',
  reviews: 'Đánh giá hiệu suất',
  recruitment: 'Tuyển dụng',
  accounts: 'Tài khoản & phân quyền',
  system: 'Giám sát hệ thống',
  profile: 'Hồ sơ của tôi',
}

export default function AccessDenied({ user, page, notFound = false, onHome }) {
  const pageLabel = PAGE_LABELS[page] || page || 'Trang yêu cầu'

  return <section className="error-page-wrap">
    <div className="error-page-card">
      <div className="error-page-icon"><ShieldX size={42} /></div>
      <div className="error-page-code">404</div>
      <span className="error-page-kicker">{notFound ? 'KHÔNG TÌM THẤY TRANG' : 'KHÔNG CÓ QUYỀN TRUY CẬP'}</span>
      <h1>{notFound ? 'Trang bạn yêu cầu không tồn tại' : 'Bạn không được phép truy cập mục này'}</h1>
      <p>
        {notFound
          ? 'Đường dẫn không tồn tại hoặc đã được thay đổi.'
          : <>Mục <b>{pageLabel}</b> không thuộc phạm vi công việc của vai trò <b>{user?.role_label || 'hiện tại'}</b>.</>}
      </p>
      {!notFound && <div className="permission-note">
        Hệ thống đã chặn truy cập. Bạn chỉ có thể sử dụng các chức năng được hiển thị trong thanh menu bên trái.
      </div>}
      <div className="error-page-actions">
        <button type="button" onClick={() => window.history.back()}><ArrowLeft size={17}/> Quay lại</button>
        <button type="button" className="primary" onClick={onHome}><Home size={17}/> Về trang Tổng quan</button>
      </div>
    </div>
  </section>
}

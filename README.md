# HR Management System

Hệ thống quản lý nhân sự full-stack theo phong cách kiến trúc `restaurant-system`: tách `backend/`, `frontend/`, chạy bằng Docker Compose.

## Công nghệ
- Backend: FastAPI, SQLAlchemy 2, PostgreSQL, JWT/RBAC
- Frontend: React + Vite
- Hạ tầng: Docker Compose

## Module đã có
1. Đăng nhập JWT, phân quyền ADMIN / HR / MANAGER / EMPLOYEE
2. Hồ sơ nhân viên: thêm, sửa, vô hiệu hóa, tìm kiếm
3. Phòng ban và chức danh
4. Chấm công: danh sách, check-in, check-out, HR cập nhật thủ công
5. Nghỉ phép: tạo đơn, duyệt, từ chối
6. Bảng lương: lương cơ bản, phụ cấp, thưởng, khấu trừ, thực nhận
7. Hợp đồng lao động
8. Đánh giá hiệu suất
9. Tuyển dụng: tin tuyển dụng và ứng viên
10. Dashboard số liệu tổng quan

## Chạy lần đầu
```bash
cp .env.example .env
docker compose up -d --build
docker compose exec backend python -m app.seed
```

Mở:
- Frontend: http://localhost:5173
- Backend Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health

Tài khoản demo:
- Email: `admin@hr.local`
- Password: `Admin@123`

## Cấu trúc
```text
hr-management-system/
├─ backend/
│  ├─ app/
│  │  ├─ routers/
│  │  ├─ models.py
│  │  ├─ schemas.py
│  │  ├─ security.py
│  │  └─ main.py
│  └─ requirements.txt
├─ frontend/
│  └─ src/
│     ├─ components/
│     └─ pages/
├─ docker-compose.yml
└─ .env.example
```

## Hướng phát triển tiếp
- Upload avatar/CCCD/hợp đồng
- Ca làm việc và lịch phân ca
- OT, đi muộn/về sớm
- Tính lương tự động theo công
- Bảo hiểm, thuế TNCN
- Xuất Excel/PDF phiếu lương
- Email thông báo
- Audit log
- Import nhân viên từ Excel
- Dashboard biểu đồ và báo cáo theo thời gian

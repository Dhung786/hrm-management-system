# Phân quyền HRM

Hệ thống dùng mã vai trò ổn định trong API/DB và hiển thị tên tiếng Việt trên giao diện.

| Mã nội bộ | Tên hiển thị | Phạm vi chính |
| --- | --- | --- |
| `ADMIN` | Quản trị hệ thống | Toàn quyền, tài khoản, phân quyền, giám sát |
| `HR` | Nhân sự | Nhân viên, phòng ban, chức vụ, hợp đồng, nghỉ phép, tuyển dụng, đánh giá |
| `MANAGER` | Trưởng phòng | Nhân viên/chấm công/nghỉ phép/đánh giá thuộc phòng mình |
| `PAYROLL` | Kế toán tiền lương | Đối soát chấm công, hợp đồng và quản lý bảng lương |
| `EMPLOYEE` | Nhân viên | Hồ sơ, chấm công, nghỉ phép, lương, hợp đồng, đánh giá của chính mình |

## Ma trận quyền

| Chức năng | Quản trị | Nhân sự | Trưởng phòng | Kế toán tiền lương | Nhân viên |
| --- | :---: | :---: | :---: | :---: | :---: |
| Dashboard | ✅ | ✅ | ✅ phòng mình | ✅ | ✅ cá nhân |
| Nhân viên | CRUD | CRUD | Xem phòng mình | Xem | Xem bản thân |
| Phòng ban & chức vụ | CRUD | CRUD | Xem | Xem | Xem |
| Chấm công | Toàn bộ | Toàn bộ | Phòng mình | Xem toàn bộ | Bản thân |
| Nghỉ phép | Toàn bộ + duyệt | Toàn bộ + duyệt | Phòng mình + duyệt | Xem | Tạo/xem bản thân |
| Hợp đồng | CRUD | CRUD | Xem phòng mình | Xem | Xem bản thân |
| Tiền lương | CRUD | ❌ | ❌ | CRUD | Xem bản thân |
| Đánh giá hiệu suất | CRUD | CRUD | CRUD phòng mình | ❌ | Xem bản thân |
| Tuyển dụng | CRUD | CRUD | ❌ | ❌ | ❌ |
| Tài khoản & phân quyền | CRUD | ❌ | ❌ | ❌ | ❌ |
| Giám sát hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ |

## Tài khoản demo

Sau khi chạy `docker compose exec backend python -m app.seed`:

- Quản trị hệ thống: `admin@hr.local` / `Admin@123`
- Nhân sự: `hr@hr.local` / `Hr123456`
- Trưởng phòng: `manager@hr.local` / `Manager123`
- Kế toán tiền lương: `payroll@hr.local` / `Payroll123`
- Nhân viên: `employee@hr.local` / `Employee123`

> Các tài khoản demo chỉ phục vụ môi trường học tập/phát triển. Đổi mật khẩu và bỏ dữ liệu demo trước khi triển khai thật.

## Kiểm thử

```bash
docker compose exec backend python -m unittest discover -s tests -p "test_*.py"
python scripts/smoke_test.py
```

Smoke test kiểm tra đăng nhập 5 vai trò, tên vai trò tiếng Việt, các API được phép/bị cấm và validation số điện thoại tối đa 10 chữ số.

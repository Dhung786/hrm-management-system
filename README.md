# HRM Management System - Đề 10

Ứng dụng thực hành môn **Triển khai và Quản trị Hệ thống Phần mềm**. Hệ thống đáp ứng Đề 10: quản lý nhân viên, phòng ban và chấm công cơ bản; sử dụng PostgreSQL + pgAdmin và triển khai toàn bộ bằng Docker Compose.

## 1. Phạm vi chức năng

- Đăng nhập JWT và phân quyền `ADMIN / HR / MANAGER / EMPLOYEE`.
- Quản lý hồ sơ nhân viên: thêm, sửa, tìm kiếm, vô hiệu hóa.
- Quản lý phòng ban và chức danh.
- Chấm công: check-in, check-out, lịch sử chấm công.
- Nghỉ phép, bảng lương, hợp đồng, đánh giá hiệu suất và tuyển dụng ở mức mở rộng.
- Dashboard tổng quan.

## 2. Kiến trúc triển khai

```text
Browser
   |
   v
Nginx reverse proxy :8080
   |----------------------> Frontend (React static)
   |----------------------> Backend (FastAPI :8000)
                                |
                                v
                         PostgreSQL :5432
                                ^
                                |
                         pgAdmin :5050

Prometheus <--- FastAPI /metrics
     |       <--- nginx-exporter
     |       <--- postgres-exporter
     |       <--- cAdvisor
     v
Grafana :3000

Docker stdout/stderr ---> Promtail ---> Loki ---> Grafana Explore
```

## 3. Thành phần Docker Compose

| Service | Vai trò | Truy cập từ máy host |
|---|---|---|
| `nginx` | Reverse proxy + security headers | `http://localhost:8080` |
| `frontend` | React/Vite build chạy bằng Nginx non-root | Chỉ nội bộ |
| `backend` | FastAPI + SQLAlchemy | Chỉ nội bộ qua Nginx |
| `db` | PostgreSQL 16 | Chỉ mạng `data_net` |
| `pgadmin` | Quản trị PostgreSQL | `http://localhost:5050` |
| `prometheus` | Thu thập metrics | `http://localhost:9090` |
| `grafana` | Dashboard metrics + logs | `http://localhost:3000` |
| `nginx-exporter` | Metrics Nginx | Chỉ nội bộ |
| `postgres-exporter` | Metrics PostgreSQL | Chỉ nội bộ |
| `cadvisor` | Metrics container | Chỉ nội bộ |
| `loki` | Lưu log tập trung | Chỉ nội bộ |
| `promtail` | Thu thập Docker logs | Chỉ nội bộ |

## 4. Chạy hệ thống

### 4.1 Chuẩn bị biến môi trường

```bash
cp .env.example .env
```

**Bắt buộc đổi toàn bộ giá trị có tiền tố `CHANGE_ME_` trước khi demo.** Có thể tạo secret mạnh bằng:

```bash
openssl rand -hex 32
```

Nếu bạn đã từng chạy phiên bản cũ dùng PostgreSQL volume trước khi có script tạo tài khoản giới hạn quyền, hãy reset dữ liệu dev một lần:

```bash
docker compose down -v
```

### 4.2 Build và chạy

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Tạo dữ liệu demo:

```bash
docker compose exec backend python -m app.seed
```

### 4.3 URL demo

- HRM qua Nginx: `http://localhost:8080`
- Swagger qua Nginx: `http://localhost:8080/docs`
- Health: `http://localhost:8080/api/health`
- pgAdmin: `http://localhost:5050`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Tài khoản ứng dụng demo sau khi seed:

- Email: `admin@hr.local`
- Password: `Admin@123`

> Tài khoản demo chỉ dùng cho môi trường thực hành. Không sử dụng mật khẩu này khi triển khai thật.

## 5. pgAdmin

Đăng nhập pgAdmin bằng `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` trong `.env`, sau đó tạo server:

- Host: `db`
- Port: `5432`
- Maintenance DB: `hr_management`
- Username: giá trị `POSTGRES_USER`
- Password: giá trị `POSTGRES_PASSWORD`

Database không publish port ra ngoài; pgAdmin truy cập DB qua mạng Docker riêng.

## 6. Nginx Reverse Proxy

File cấu hình: `infrastructure/nginx/nginx.conf`.

Các biện pháp có sẵn:

- Reverse proxy `/api/*` sang FastAPI.
- Reverse proxy web sang frontend.
- Ẩn phiên bản Nginx (`server_tokens off`).
- Rate limit API.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy`.
- `Permissions-Policy`.
- Content Security Policy cơ bản.

Kiểm tra header:

```bash
curl -I http://localhost:8080
```

## 7. Prometheus + Grafana

Prometheus scrape 4 nhóm mục tiêu:

1. FastAPI `/metrics`.
2. Nginx qua `nginx-prometheus-exporter`.
3. PostgreSQL qua `postgres-exporter`.
4. Container qua cAdvisor.

Kiểm tra tại `http://localhost:9090/targets`: các target cần ở trạng thái **UP**.

Grafana tự provision datasource Prometheus và dashboard **HRM - System Overview**. Dashboard có request rate backend, trạng thái PostgreSQL, kết nối Nginx, CPU và RAM container.

## 8. Loki + Promtail + LogQL

Promtail đọc log Docker qua Docker socket ở chế độ chỉ đọc và gửi về Loki. Loki được provision sẵn thành datasource trong Grafana.

Vào `Grafana -> Explore -> Loki` và demo ít nhất 3 truy vấn LogQL:

```logql
{service="backend"}
```

```logql
{service="nginx"} |= " 5"
```

```logql
sum by (service) (count_over_time({service=~"backend|nginx|db"}[5m]))
```

Có thể tạo request để sinh log:

```bash
curl http://localhost:8080/api/health
```

## 9. Hardening đã áp dụng

1. **Non-root container**: backend chạy user UID `10001`; frontend và Nginx dùng image `nginx-unprivileged`.
2. **Network isolation**: `app_net`, `data_net`, `observability_net` đặt `internal: true`; PostgreSQL không publish port ra host.
3. **Least privilege DB**: ứng dụng dùng role `hrm_app`; exporter dùng role `hrm_metrics` có `pg_monitor`; tài khoản DB admin không được app sử dụng.
4. **Secrets ngoài Git**: `.env` bị ignore; repository chỉ chứa `.env.example`.
5. **Container restrictions**: `read_only`, `cap_drop: ALL`, `no-new-privileges` được áp dụng cho các service phù hợp.
6. **Security headers + rate limiting** tại Nginx.
7. **Management UI bind localhost**: pgAdmin, Prometheus và Grafana chỉ bind `127.0.0.1`.
8. **Logging/metrics retention giới hạn** để tránh tăng dung lượng vô hạn.

> cAdvisor cần quyền cao hơn để đọc metrics container/host; đây là ngoại lệ có chủ đích cho thành phần giám sát, trong khi các service ứng dụng vẫn bị giới hạn quyền.

## 10. Commit phục vụ tiêu chí chấm điểm

Trên nhánh `develop` có các commit riêng theo yêu cầu môn học:

1. `feat(infra): add Nginx reverse proxy, pgAdmin and security headers`
2. `feat(monitoring): add Prometheus, Grafana and system exporters`
3. `feat(logging): add Loki, Promtail and centralized request logs`
4. `chore(security): harden containers, isolate networks and document demo`

## 11. Kiểm tra trước khi demo

```bash
git status
docker compose config
docker compose up -d --build
docker compose ps
curl -I http://localhost:8080
curl http://localhost:8080/api/health
```

Sau đó kiểm tra lần lượt: website -> pgAdmin -> Prometheus Targets -> Grafana Dashboard -> Grafana Explore/Loki -> LogQL.

Chi tiết checklist ảnh minh chứng nằm trong `docs/DEMO_CHECKLIST.md`.

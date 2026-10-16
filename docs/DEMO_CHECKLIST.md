# Checklist demo và ảnh minh chứng - Đề 10 HRM

Tài liệu này dùng để chuẩn bị demo và báo cáo tối thiểu 10 trang.

## A. GitHub - 1.5 điểm

- [ ] Ảnh trang repository `Dhung786/hrm-management-system`.
- [ ] Ảnh cây thư mục có source + `docker-compose.yml` + `infrastructure/`.
- [ ] Ảnh lịch sử commit thể hiện ít nhất 3 commit hạ tầng có ý nghĩa.
- [ ] Ảnh README hướng dẫn chạy.

## B. Ứng dụng + Database - 1.5 điểm

- [ ] Ảnh trang đăng nhập HRM.
- [ ] Ảnh danh sách nhân viên.
- [ ] Ảnh phòng ban/chức danh hoặc dữ liệu liên quan.
- [ ] Ảnh màn hình chấm công.
- [ ] Ảnh pgAdmin kết nối database `hr_management`.
- [ ] Ảnh bảng PostgreSQL có dữ liệu demo.

## C. Nginx Reverse Proxy - 1.5 điểm

- [ ] Website truy cập qua `http://localhost:8080`.
- [ ] `curl -I http://localhost:8080` hiển thị security headers.
- [ ] Ảnh file `infrastructure/nginx/nginx.conf`.

## D. Prometheus + Grafana - 1.5 điểm

- [ ] `http://localhost:9090/targets` có backend/nginx/postgres/cadvisor ở trạng thái UP.
- [ ] Grafana dashboard `HRM - System Overview`.
- [ ] Panel CPU/RAM container.
- [ ] Panel Nginx/PostgreSQL/backend request.

## E. Loki + LogQL - 1.5 điểm

Chạy một số request trước:

```bash
curl http://localhost:8080/api/health
```

Chụp ảnh Grafana Explore với 3 query:

```logql
{service="backend"}
```

```logql
{service="nginx"} |= " 5"
```

```logql
sum by (service) (count_over_time({service=~"backend|nginx|db"}[5m]))
```

## F. Hardening - 1.5 điểm

Chụp ảnh/minh chứng ít nhất 4 mục:

- [ ] Backend chạy non-root.
- [ ] PostgreSQL không có port publish ra host.
- [ ] `app_net` / `data_net` / `observability_net` isolated.
- [ ] `.env` không nằm trong Git.
- [ ] Nginx security headers.
- [ ] `cap_drop: ALL` và `no-new-privileges`.
- [ ] App dùng DB role `hrm_app`, exporter dùng `hrm_metrics`.

Lệnh kiểm tra:

```bash
docker compose exec backend id
docker compose ps
git check-ignore .env
docker inspect hrms-backend --format '{{json .HostConfig.CapDrop}} {{json .HostConfig.SecurityOpt}}'
```

## G. Tổng thể & trình bày - 1.0 điểm

- [ ] `docker compose up -d --build` chạy toàn bộ stack.
- [ ] Có ảnh `docker compose ps` các container hoạt động.
- [ ] Báo cáo tối thiểu 10 trang.
- [ ] Giải thích được luồng request Browser -> Nginx -> Frontend/Backend -> PostgreSQL.
- [ ] Giải thích được metrics path và logging pipeline.
- [ ] Nêu được ngoại lệ cAdvisor cần quyền cao để thu metrics.

## Gợi ý bố cục báo cáo 10+ trang

1. Bìa báo cáo.
2. Giới thiệu đề tài và mục tiêu.
3. Kiến trúc hệ thống.
4. Ứng dụng HRM và PostgreSQL/pgAdmin.
5. Nginx reverse proxy và security headers.
6. Prometheus và exporters.
7. Grafana dashboard.
8. Loki + Promtail + LogQL.
9. Hardening hệ thống.
10. Kết quả demo, đánh giá và kết luận.

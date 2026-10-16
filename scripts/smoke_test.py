import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.getenv("HRM_BASE_URL", "http://localhost:8080").rstrip("/")


def call(path, method="GET", body=None, token=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            payload = res.read().decode()
            return res.status, json.loads(payload) if payload else None
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode()
        try:
            payload = json.loads(payload)
        except Exception:
            pass
        return exc.code, payload
    except urllib.error.URLError as exc:
        return 0, {"detail": f"Không kết nối được tới {BASE}: {exc.reason}"}


def check(name, condition, detail=""):
    passed = bool(condition)
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {name}{': ' + str(detail) if detail else ''}")
    return passed


def login(email, password):
    status, data = call("/api/auth/login", "POST", {"email": email, "password": password})
    token = data.get("access_token") if status == 200 and isinstance(data, dict) else None
    return status, data, token


def main():
    ok = True

    status, data = call("/api/health")
    ok &= check("health", status == 200, data)

    status, data, admin_token = login("admin@hr.local", "Admin@123")
    login_ok = status == 200 and bool(admin_token)
    ok &= check("login Quản trị hệ thống", login_ok, f"HTTP {status}, role={data.get('role') if isinstance(data, dict) else None}")
    if not login_ok:
        print("Gợi ý: chạy 'docker compose exec backend python -m app.seed' để tạo đủ tài khoản demo.")
        sys.exit(1)

    status, me = call("/api/auth/me", token=admin_token)
    ok &= check("/api/auth/me có tên vai trò tiếng Việt", status == 200 and me.get("role_label") == "Quản trị hệ thống", f"HTTP {status}, role_label={me.get('role_label') if isinstance(me, dict) else None}")

    admin_endpoints = [
        "/api/hr/employees", "/api/hr/departments", "/api/hr/positions", "/api/attendance",
        "/api/leaves", "/api/payroll", "/api/talent/contracts", "/api/talent/reviews",
        "/api/talent/jobs", "/api/talent/candidates", "/api/accounts",
    ]
    for endpoint in admin_endpoints:
        status, payload = call(endpoint, token=admin_token)
        ok &= check(f"ADMIN GET {endpoint}", status == 200 and isinstance(payload, list), f"HTTP {status}")

    # Logic regression: phone > 10 digits must be rejected before reaching the DB.
    status, _ = call(
        "/api/hr/employees",
        "POST",
        {
            "employee_code": "INVALIDPHONE",
            "full_name": "Test Validation",
            "email": "invalid-phone-test@example.com",
            "phone": "09123456789",
            "base_salary": 0,
        },
        admin_token,
    )
    ok &= check("reject phone > 10 digits", status == 422, f"HTTP {status}")

    role_cases = [
        {
            "label": "Nhân sự", "email": "hr@hr.local", "password": "Hr123456", "role": "HR",
            "allow": ["/api/hr/employees", "/api/hr/departments", "/api/talent/contracts", "/api/talent/jobs", "/api/talent/candidates"],
            "deny": ["/api/payroll", "/api/accounts"],
        },
        {
            "label": "Trưởng phòng", "email": "manager@hr.local", "password": "Manager123", "role": "MANAGER",
            "allow": ["/api/hr/employees", "/api/attendance", "/api/leaves", "/api/talent/contracts", "/api/talent/reviews"],
            "deny": ["/api/payroll", "/api/talent/jobs", "/api/accounts"],
        },
        {
            "label": "Kế toán tiền lương", "email": "payroll@hr.local", "password": "Payroll123", "role": "PAYROLL",
            "allow": ["/api/hr/employees", "/api/attendance", "/api/leaves", "/api/payroll", "/api/talent/contracts"],
            "deny": ["/api/talent/reviews", "/api/talent/jobs", "/api/accounts"],
        },
        {
            "label": "Nhân viên", "email": "employee@hr.local", "password": "Employee123", "role": "EMPLOYEE",
            "allow": ["/api/hr/employees", "/api/attendance", "/api/leaves", "/api/payroll", "/api/talent/contracts", "/api/talent/reviews"],
            "deny": ["/api/talent/jobs", "/api/talent/candidates", "/api/accounts"],
        },
    ]

    for case in role_cases:
        status, data, token = login(case["email"], case["password"])
        role_ok = status == 200 and bool(token) and data.get("role") == case["role"]
        ok &= check(f"login {case['label']}", role_ok, f"HTTP {status}, role={data.get('role') if isinstance(data, dict) else None}")
        if not token:
            continue

        status, me = call("/api/auth/me", token=token)
        ok &= check(f"role_label {case['label']}", status == 200 and me.get("role_label") == case["label"], f"HTTP {status}")

        for endpoint in case["allow"]:
            status, payload = call(endpoint, token=token)
            ok &= check(f"{case['role']} allow {endpoint}", status == 200, f"HTTP {status}")
            if case["role"] == "EMPLOYEE" and endpoint == "/api/hr/employees" and status == 200:
                ok &= check("Nhân viên chỉ thấy hồ sơ của mình", isinstance(payload, list) and len(payload) <= 1, f"rows={len(payload) if isinstance(payload, list) else '?'}")

        for endpoint in case["deny"]:
            status, _ = call(endpoint, token=token)
            ok &= check(f"{case['role']} deny {endpoint}", status == 403, f"HTTP {status}")

    print("\nSmoke test RBAC", "PASSED" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

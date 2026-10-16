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


def main():
    ok = True

    status, data = call("/api/health")
    ok &= check("health", status == 200, data)

    status, data = call(
        "/api/auth/login",
        "POST",
        {"email": "admin@hr.local", "password": "Admin@123"},
    )
    login_ok = status == 200 and isinstance(data, dict) and bool(data.get("access_token"))
    ok &= check("login", login_ok, f"HTTP {status}, role={data.get('role') if isinstance(data, dict) else None}")
    if not login_ok:
        sys.exit(1)

    token = data["access_token"]

    endpoints = [
        "/api/hr/employees",
        "/api/hr/departments",
        "/api/hr/positions",
        "/api/attendance",
        "/api/leaves",
        "/api/payroll",
        "/api/talent/contracts",
        "/api/talent/reviews",
        "/api/talent/jobs",
        "/api/talent/candidates",
    ]
    for endpoint in endpoints:
        status, data = call(endpoint, token=token)
        ok &= check(
            f"GET {endpoint}",
            status == 200 and isinstance(data, list),
            f"HTTP {status}",
        )

    # Logic regression: phone > 10 digits must be rejected before reaching the DB.
    status, data = call(
        "/api/hr/employees",
        "POST",
        {
            "employee_code": "INVALIDPHONE",
            "full_name": "Test Validation",
            "email": "invalid-phone-test@example.com",
            "phone": "09123456789",
            "base_salary": 0,
        },
        token,
    )
    ok &= check("reject phone > 10 digits", status == 422, f"HTTP {status}")

    print("\nSmoke test", "PASSED" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()

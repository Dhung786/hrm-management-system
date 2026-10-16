ROLE_LABELS = {
    "ADMIN": "Quản trị hệ thống",
    "HR": "Nhân sự",
    "MANAGER": "Trưởng phòng",
    "PAYROLL": "Kế toán tiền lương",
    "EMPLOYEE": "Nhân viên",
}

ALL_ROLES = set(ROLE_LABELS)


def role_label(role: str) -> str:
    return ROLE_LABELS.get(role, role)

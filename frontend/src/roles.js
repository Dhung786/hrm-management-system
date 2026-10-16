export const ROLE_LABELS = {
  ADMIN: 'Quản trị hệ thống',
  HR: 'Nhân sự',
  MANAGER: 'Trưởng phòng',
  PAYROLL: 'Kế toán tiền lương',
  EMPLOYEE: 'Nhân viên',
}

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

export const roleLabel = role => ROLE_LABELS[role] || role || 'Chưa xác định'

export const canManageEmployees = role => ['ADMIN', 'HR'].includes(role)
export const canManagePayroll = role => ['ADMIN', 'PAYROLL'].includes(role)
export const canApproveLeave = role => ['ADMIN', 'HR', 'MANAGER'].includes(role)
export const canManageRecruitment = role => ['ADMIN', 'HR'].includes(role)
export const canManageAccounts = role => role === 'ADMIN'
export const canManageReviews = role => ['ADMIN', 'HR', 'MANAGER'].includes(role)

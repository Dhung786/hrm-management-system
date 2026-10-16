import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, UserRoundCheck, UserRoundX, UsersRound, Workflow } from 'lucide-react'
import { request } from '../api'
import { canManageEmployees } from '../roles'

const blank = {
  employee_code: '', full_name: '', email: '', phone: '', date_of_birth: '', gender: '', address: '',
  hire_date: new Date().toISOString().slice(0, 10), base_salary: 0, status: 'ACTIVE', department_id: '', position_id: '',
}

function validate(form) {
  if (!form.employee_code.trim()) return 'Mã nhân viên là bắt buộc'
  if (!form.full_name.trim()) return 'Họ tên là bắt buộc'
  if (/\d/.test(form.full_name)) return 'Họ tên không được chứa chữ số'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email không hợp lệ'
  if (form.phone && !/^\d{9,10}$/.test(form.phone)) return 'Số điện thoại chỉ được gồm 9-10 chữ số và không được quá 10 số'
  if (Number(form.base_salary) < 0) return 'Lương cơ bản không được âm'
  if (form.date_of_birth && form.date_of_birth > new Date().toISOString().slice(0, 10)) return 'Ngày sinh không được ở tương lai'
  return ''
}

export default function Employees({ user }) {
  const role = user?.role
  const editable = canManageEmployees(role)
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const departmentMap = useMemo(() => Object.fromEntries(departments.map(x => [x.id, x.name])), [departments])
  const positionMap = useMemo(() => Object.fromEntries(positions.map(x => [x.id, x.name])), [positions])

  const load = async () => {
    try {
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        request('/api/hr/employees'), request('/api/hr/departments'), request('/api/hr/positions'),
      ])
      setItems(employeesData); setDepartments(departmentsData); setPositions(positionsData)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    const localError = validate(form); if (localError) return setError(localError)
    const payload = {
      ...form, phone: form.phone || null, date_of_birth: form.date_of_birth || null, gender: form.gender || null,
      address: form.address || null, base_salary: Number(form.base_salary),
      department_id: form.department_id ? Number(form.department_id) : null,
      position_id: form.position_id ? Number(form.position_id) : null,
    }
    try {
      await request(editingId ? `/api/hr/employees/${editingId}` : '/api/hr/employees', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setMessage(editingId ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công')
      setEditingId(null); setForm(blank); setShowForm(false); await load()
    } catch (e) { setError(e.message) }
  }

  const edit = (x) => {
    setEditingId(x.id); setError(''); setMessage('')
    setForm({ ...blank, ...x, phone: x.phone || '', date_of_birth: x.date_of_birth || '', gender: x.gender || '', address: x.address || '', department_id: x.department_id || '', position_id: x.position_id || '' })
    setShowForm(true)
  }

  const deactivate = async (x) => {
    if (!confirm(`Chuyển ${x.full_name} sang trạng thái nghỉ việc?`)) return
    try { await request(`/api/hr/employees/${x.id}`, { method: 'DELETE' }); setMessage('Đã chuyển nhân viên sang trạng thái nghỉ việc'); await load() }
    catch (e) { setError(e.message) }
  }

  const filteredItems = useMemo(() => items.filter(x => {
    const keyword = query.trim().toLowerCase()
    const matchesText = !keyword || `${x.employee_code} ${x.full_name} ${x.email} ${x.phone || ''} ${departmentMap[x.department_id] || ''} ${positionMap[x.position_id] || ''}`.toLowerCase().includes(keyword)
    const matchesDepartment = departmentFilter === 'ALL' || String(x.department_id || '') === departmentFilter
    const matchesStatus = statusFilter === 'ALL' || x.status === statusFilter
    return matchesText && matchesDepartment && matchesStatus
  }), [items, query, departmentFilter, statusFilter, departmentMap, positionMap])

  const activeCount = items.filter(x => x.status === 'ACTIVE').length
  const leaveCount = items.filter(x => x.status === 'ON_LEAVE').length
  const inactiveCount = items.filter(x => x.status === 'INACTIVE').length
  const title = role === 'MANAGER' ? 'Nhân viên thuộc phòng của tôi' : 'Quản lý nhân viên'

  return <section>
    <div className="page-title page-title-modern">
      <div><span>NHÂN SỰ</span><h1>{title}</h1><p>{role === 'MANAGER' ? `Theo dõi nhân viên thuộc ${user?.department_name || 'phòng ban bạn phụ trách'}.` : 'Quản lý hồ sơ, phòng ban, chức vụ và trạng thái làm việc của nhân viên.'}</p></div>
      {editable && <button className="primary page-primary-action" onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}><Plus size={17}/> Thêm nhân viên</button>}
    </div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><UsersRound size={20}/></div><div><span>Tổng nhân viên</span><strong>{items.length}</strong><small>Tất cả hồ sơ trong phạm vi</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><UserRoundCheck size={20}/></div><div><span>Đang làm việc</span><strong>{activeCount}</strong><small>Nhân viên đang hoạt động</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><Workflow size={20}/></div><div><span>Tạm nghỉ</span><strong>{leaveCount}</strong><small>Nhân viên đang tạm nghỉ</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><UserRoundX size={20}/></div><div><span>Đã nghỉ việc</span><strong>{inactiveCount}</strong><small>Hồ sơ vẫn được lưu lịch sử</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel">
      <div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm theo họ tên, mã, email, SĐT..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}><option value="ALL">Tất cả phòng ban</option>{departments.map(x => <option key={x.id} value={String(x.id)}>{x.name}</option>)}</select><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang làm</option><option value="ON_LEAVE">Tạm nghỉ</option><option value="INACTIVE">Đã nghỉ việc</option></select></div>
      <div className="table-wrap"><table className="employee-table"><thead><tr><th>STT</th><th>Nhân viên</th><th>Số điện thoại</th><th>Phòng ban</th><th>Chức vụ</th>{role !== 'MANAGER' && <th>Lương cơ bản</th>}<th>Trạng thái</th>{editable && <th>Thao tác</th>}</tr></thead><tbody>{filteredItems.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><div className="person-cell"><div className="person-avatar">{x.full_name?.charAt(0)?.toUpperCase()}</div><div><b>{x.full_name}</b><small>{x.employee_code} · {x.email}</small></div></div></td><td>{x.phone || '-'}</td><td>{departmentMap[x.department_id] || '-'}</td><td><span className="role-chip">{positionMap[x.position_id] || '-'}</span></td>{role !== 'MANAGER' && <td>{Number(x.base_salary).toLocaleString('vi-VN')} đ</td>}<td><span className={x.status === 'INACTIVE' ? 'badge badge-off' : x.status === 'ON_LEAVE' ? 'badge badge-wait' : 'badge'}>{x.status === 'ACTIVE' ? 'Đang làm' : x.status === 'ON_LEAVE' ? 'Tạm nghỉ' : 'Đã nghỉ việc'}</span></td>{editable && <td><div className="actions"><button onClick={() => edit(x)}>Sửa</button>{x.status !== 'INACTIVE' && <button className="danger" onClick={() => deactivate(x)}>Nghỉ việc</button>}</div></td>}</tr>)}</tbody></table></div>
      <div className="table-footer">Hiển thị {filteredItems.length} / {items.length} nhân viên</div>
    </div>

    {showForm && editable && <div className="modal-backdrop"><form className="modal-card employee-modal employee-compact-modal" onSubmit={save}>
      <div className="modal-head"><div><span>NHÂN VIÊN</span><h2>{editingId ? 'Cập nhật hồ sơ' : 'Thêm nhân viên mới'}</h2></div><button type="button" onClick={() => setShowForm(false)}>✕</button></div>

      <div className="employee-form-table">
        <div className="employee-form-row">
          <label className="employee-form-cell"><span>Mã NV</span><input maxLength={30} value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value.toUpperCase() })} required /></label>
          <label className="employee-form-cell"><span>Họ tên</span><input maxLength={160} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></label>
        </div>
        <div className="employee-form-row">
          <label className="employee-form-cell"><span>Email</span><input type="email" maxLength={160} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="employee-form-cell"><span>Điện thoại</span><input inputMode="numeric" maxLength={10} placeholder="9-10 chữ số" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
        </div>
        <div className="employee-form-row">
          <label className="employee-form-cell"><span>Ngày sinh</span><input type="date" value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></label>
          <label className="employee-form-cell"><span>Giới tính</span><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">-- Chọn --</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
        </div>
        <div className="employee-form-row">
          <label className="employee-form-cell"><span>Ngày vào làm</span><input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} required /></label>
          <label className="employee-form-cell"><span>Phòng ban</span><select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">-- Chưa gán --</option>{departments.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        </div>
        <div className="employee-form-row">
          <label className="employee-form-cell"><span>Chức vụ</span><select value={form.position_id} onChange={e => setForm({ ...form, position_id: e.target.value })}><option value="">-- Chưa gán --</option>{positions.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="employee-form-cell"><span>Lương cơ bản</span><input type="number" min="0" step="1000" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} /></label>
        </div>
        <div className="employee-form-row employee-form-row-wide">
          <label className="employee-form-cell employee-form-cell-wide"><span>Địa chỉ</span><textarea maxLength={1000} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        </div>
        <div className="employee-form-row employee-form-row-last">
          <label className="employee-form-cell"><span>Trạng thái</span><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Đang làm</option><option value="ON_LEAVE">Tạm nghỉ</option><option value="INACTIVE">Nghỉ việc</option></select></label>
          <div className="employee-form-summary"><span>Thông tin nhân viên được gom trong một bảng để dễ nhập và kiểm tra.</span></div>
        </div>
      </div>

      <div className="actions employee-form-actions"><button type="button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary">{editingId ? 'Cập nhật' : 'Lưu nhân viên'}</button></div>
    </form></div>}
  </section>
}

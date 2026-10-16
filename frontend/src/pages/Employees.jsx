import { useEffect, useMemo, useState } from 'react'
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
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const departmentMap = useMemo(() => Object.fromEntries(departments.map(x => [x.id, x.name])), [departments])
  const positionMap = useMemo(() => Object.fromEntries(positions.map(x => [x.id, x.name])), [positions])

  const load = async () => {
    try {
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        request('/api/hr/employees' + (q ? `?q=${encodeURIComponent(q)}` : '')),
        request('/api/hr/departments'), request('/api/hr/positions'),
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
      setEditingId(null); setForm(blank); await load()
    } catch (e) { setError(e.message) }
  }

  const edit = (x) => {
    setEditingId(x.id); setError(''); setMessage('')
    setForm({ ...blank, ...x, phone: x.phone || '', date_of_birth: x.date_of_birth || '', gender: x.gender || '', address: x.address || '', department_id: x.department_id || '', position_id: x.position_id || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deactivate = async (x) => {
    if (!confirm(`Chuyển ${x.full_name} sang trạng thái nghỉ việc?`)) return
    try { await request(`/api/hr/employees/${x.id}`, { method: 'DELETE' }); setMessage('Đã chuyển nhân viên sang trạng thái nghỉ việc'); await load() }
    catch (e) { setError(e.message) }
  }

  const activeCount = items.filter(x => x.status === 'ACTIVE').length
  const leaveCount = items.filter(x => x.status === 'ON_LEAVE').length
  const departmentCount = new Set(items.map(x => x.department_id).filter(Boolean)).size
  const title = role === 'MANAGER' ? 'Nhân viên thuộc phòng của tôi' : 'Quản lý nhân viên'
  const subtitle = role === 'MANAGER'
    ? `Bạn chỉ xem được nhân viên thuộc ${user?.department_name || 'phòng ban đang phụ trách'}; các thao tác thêm, sửa và lương được ẩn.`
    : 'Quản lý hồ sơ, thông tin liên hệ, phòng ban, chức vụ và trạng thái làm việc.'

  return <section>
    <div className="page-title page-title-modern">
      <div><span>NHÂN SỰ</span><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="page-toolbar"><input className="search" placeholder="Tìm tên, mã, email, SĐT..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} /><button onClick={load}>Tìm kiếm</button></div>
    </div>

    <div className="scope-banner"><div><b>{user?.role_label}</b><span>{role === 'MANAGER' ? `Phạm vi: ${user?.department_name || 'phòng ban của bạn'}` : 'Phạm vi: toàn bộ nhân sự doanh nghiệp'}</span></div><span className="badge">{editable ? 'Có quyền chỉnh sửa' : 'Chỉ xem'}</span></div>

    <div className="mini-stats">
      <div><span>Tổng hồ sơ</span><b>{items.length}</b></div>
      <div><span>Đang làm</span><b>{activeCount}</b></div>
      <div><span>Tạm nghỉ</span><b>{leaveCount}</b></div>
      <div><span>Phòng ban</span><b>{departmentCount}</b></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className={editable ? 'work-grid' : 'work-grid single'}>
      {editable && <div className="panel form-panel"><div className="panel-heading"><div><span>HỒ SƠ</span><h2>{editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h2></div></div><form className="form-grid two-col-form" onSubmit={save}>
        <label>Mã NV<input maxLength={30} value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value.toUpperCase() })} required /></label>
        <label>Họ tên<input maxLength={160} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></label>
        <label>Email<input type="email" maxLength={160} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Điện thoại<input inputMode="numeric" maxLength={10} placeholder="9-10 chữ số" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
        <label>Ngày sinh<input type="date" value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></label>
        <label>Giới tính<select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">-- Chọn --</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
        <label>Ngày vào làm<input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} required /></label>
        <label>Phòng ban<select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">-- Chưa gán --</option>{departments.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Chức vụ<select value={form.position_id} onChange={e => setForm({ ...form, position_id: e.target.value })}><option value="">-- Chưa gán --</option>{positions.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label>Lương cơ bản<input type="number" min="0" step="1000" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} /></label>
        <label className="span-2">Địa chỉ<textarea maxLength={1000} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        <label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Đang làm</option><option value="ON_LEAVE">Tạm nghỉ</option><option value="INACTIVE">Nghỉ việc</option></select></label>
        <div className="actions span-2"><button className="primary">{editingId ? 'Cập nhật hồ sơ' : 'Lưu nhân viên'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank) }}>Hủy sửa</button>}</div>
      </form></div>}

      <div className="panel data-panel"><div className="panel-heading"><div><span>DANH SÁCH</span><h2>{items.length} nhân viên</h2></div><small>{role === 'MANAGER' ? 'Chỉ hiển thị dữ liệu phòng của bạn' : 'Dữ liệu nhân sự hiện tại'}</small></div><div className="table-wrap"><table className="employee-table"><thead><tr><th>Mã</th><th>Họ tên</th><th>Liên hệ</th><th>Phòng ban</th><th>Chức vụ</th>{role !== 'MANAGER' && <th>Lương cơ bản</th>}<th>Trạng thái</th>{editable && <th>Thao tác</th>}</tr></thead><tbody>{items.map(x => <tr key={x.id}><td><b>{x.employee_code}</b></td><td><div className="person-cell"><div className="person-avatar">{x.full_name?.charAt(0)?.toUpperCase()}</div><div><b>{x.full_name}</b><small>{x.email}</small></div></div></td><td>{x.phone || '-'}<br/><small>{x.email}</small></td><td>{departmentMap[x.department_id] || '-'}</td><td>{positionMap[x.position_id] || '-'}</td>{role !== 'MANAGER' && <td>{Number(x.base_salary).toLocaleString('vi-VN')} đ</td>}<td><span className={x.status === 'INACTIVE' ? 'badge badge-off' : x.status === 'ON_LEAVE' ? 'badge badge-wait' : 'badge'}>{x.status === 'ACTIVE' ? 'Đang làm' : x.status === 'ON_LEAVE' ? 'Tạm nghỉ' : 'Nghỉ việc'}</span></td>{editable && <td><div className="actions"><button onClick={() => edit(x)}>Sửa</button>{x.status !== 'INACTIVE' && <button className="danger" onClick={() => deactivate(x)}>Nghỉ việc</button>}</div></td>}</tr>)}</tbody></table></div></div>
    </div>
  </section>
}

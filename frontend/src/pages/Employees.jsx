import { useEffect, useMemo, useState } from 'react'
import { request } from '../api'

const blank = {
  employee_code: '',
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  address: '',
  hire_date: new Date().toISOString().slice(0, 10),
  base_salary: 0,
  status: 'ACTIVE',
  department_id: '',
  position_id: '',
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

export default function Employees() {
  const [items, setItems] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [form, setForm] = useState(blank)
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [positionName, setPositionName] = useState('')

  const departmentMap = useMemo(() => Object.fromEntries(departments.map(x => [x.id, x.name])), [departments])
  const positionMap = useMemo(() => Object.fromEntries(positions.map(x => [x.id, x.name])), [positions])

  const load = async () => {
    try {
      const [employeesData, departmentsData, positionsData] = await Promise.all([
        request('/api/hr/employees' + (q ? `?q=${encodeURIComponent(q)}` : '')),
        request('/api/hr/departments'),
        request('/api/hr/positions'),
      ])
      setItems(employeesData)
      setDepartments(departmentsData)
      setPositions(positionsData)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    const localError = validate(form)
    if (localError) return setError(localError)
    const payload = {
      ...form,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      address: form.address || null,
      base_salary: Number(form.base_salary),
      department_id: form.department_id ? Number(form.department_id) : null,
      position_id: form.position_id ? Number(form.position_id) : null,
    }
    try {
      await request(editingId ? `/api/hr/employees/${editingId}` : '/api/hr/employees', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setMessage(editingId ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công')
      setEditingId(null)
      setForm(blank)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const edit = (x) => {
    setEditingId(x.id)
    setError('')
    setMessage('')
    setForm({
      ...blank,
      ...x,
      phone: x.phone || '',
      date_of_birth: x.date_of_birth || '',
      gender: x.gender || '',
      address: x.address || '',
      department_id: x.department_id || '',
      position_id: x.position_id || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deactivate = async (x) => {
    if (!confirm(`Chuyển ${x.full_name} sang trạng thái nghỉ việc?`)) return
    try {
      await request(`/api/hr/employees/${x.id}`, { method: 'DELETE' })
      setMessage('Đã vô hiệu hóa nhân viên')
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const addDepartment = async () => {
    if (departmentName.trim().length < 2) return setError('Tên phòng ban phải có ít nhất 2 ký tự')
    try {
      await request('/api/hr/departments', { method: 'POST', body: JSON.stringify({ name: departmentName.trim() }) })
      setDepartmentName('')
      await load()
    } catch (e) { setError(e.message) }
  }

  const addPosition = async () => {
    if (positionName.trim().length < 2) return setError('Tên chức vụ phải có ít nhất 2 ký tự')
    try {
      await request('/api/hr/positions', { method: 'POST', body: JSON.stringify({ name: positionName.trim() }) })
      setPositionName('')
      await load()
    } catch (e) { setError(e.message) }
  }

  return <section>
    <div className="page-title">
      <div><span>NHÂN SỰ</span><h1>Danh sách nhân viên</h1></div>
      <input className="search" placeholder="Tìm tên, mã, email, SĐT..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
    </div>

    {error && <div className="error notice">{error}</div>}
    {message && <div className="success notice">{message}</div>}

    <div className="split">
      <div className="panel">
        <h2>{editingId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Mã NV<input maxLength={30} value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value.toUpperCase() })} required /></label>
          <label>Họ tên<input maxLength={160} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></label>
          <label>Email<input type="email" maxLength={160} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Điện thoại<input inputMode="numeric" maxLength={10} placeholder="Tối đa 10 chữ số" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
          <label>Ngày sinh<input type="date" value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></label>
          <label>Giới tính<select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="">-- Chọn --</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
          <label>Ngày vào làm<input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} required /></label>
          <label>Phòng ban<select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">-- Chưa gán --</option>{departments.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Chức vụ<select value={form.position_id} onChange={e => setForm({ ...form, position_id: e.target.value })}><option value="">-- Chưa gán --</option>{positions.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label>Lương cơ bản<input type="number" min="0" step="1000" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} /></label>
          <label>Địa chỉ<textarea maxLength={1000} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
          <label>Trạng thái<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="ACTIVE">Đang làm</option><option value="ON_LEAVE">Tạm nghỉ</option><option value="INACTIVE">Nghỉ việc</option></select></label>
          <div className="actions"><button className="primary">{editingId ? 'Cập nhật' : 'Lưu nhân viên'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank) }}>Hủy sửa</button>}</div>
        </form>
        <hr />
        <h3>Danh mục nhanh</h3>
        <div className="form-grid"><label>Phòng ban mới<input value={departmentName} onChange={e => setDepartmentName(e.target.value)} /></label><button type="button" onClick={addDepartment}>Thêm phòng ban</button><label>Chức vụ mới<input value={positionName} onChange={e => setPositionName(e.target.value)} /></label><button type="button" onClick={addPosition}>Thêm chức vụ</button></div>
      </div>

      <div className="panel grow"><h2>{items.length} nhân viên</h2><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Họ tên</th><th>Liên hệ</th><th>Phòng ban</th><th>Chức vụ</th><th>Lương</th><th>Trạng thái</th><th></th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{x.employee_code}</td><td><b>{x.full_name}</b></td><td>{x.email}<br /><small>{x.phone || '-'}</small></td><td>{departmentMap[x.department_id] || '-'}</td><td>{positionMap[x.position_id] || '-'}</td><td>{Number(x.base_salary).toLocaleString('vi-VN')} đ</td><td><span className="badge">{x.status}</span></td><td><div className="actions"><button onClick={() => edit(x)}>Sửa</button>{x.status !== 'INACTIVE' && <button className="danger" onClick={() => deactivate(x)}>Nghỉ việc</button>}</div></td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

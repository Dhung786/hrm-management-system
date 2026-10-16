import { useEffect, useState } from 'react'
import { request } from '../api'
import { canManageEmployees } from '../roles'

export default function Organization() {
  const role = localStorage.getItem('role')
  const editable = canManageEmployees(role)
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [departmentForm, setDepartmentForm] = useState({ id: null, name: '', description: '' })
  const [positionForm, setPositionForm] = useState({ id: null, name: '', level: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [deps, pos] = await Promise.all([request('/api/hr/departments'), request('/api/hr/positions')])
      setDepartments(deps); setPositions(pos)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const saveDepartment = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      const method = departmentForm.id ? 'PUT' : 'POST'
      const path = departmentForm.id ? `/api/hr/departments/${departmentForm.id}` : '/api/hr/departments'
      await request(path, { method, body: JSON.stringify({ name: departmentForm.name, description: departmentForm.description || null }) })
      setDepartmentForm({ id: null, name: '', description: '' }); setMessage('Đã lưu phòng ban'); await load()
    } catch (e) { setError(e.message) }
  }

  const savePosition = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      const method = positionForm.id ? 'PUT' : 'POST'
      const path = positionForm.id ? `/api/hr/positions/${positionForm.id}` : '/api/hr/positions'
      await request(path, { method, body: JSON.stringify({ name: positionForm.name, level: positionForm.level || null }) })
      setPositionForm({ id: null, name: '', level: '' }); setMessage('Đã lưu chức vụ'); await load()
    } catch (e) { setError(e.message) }
  }

  const remove = async (type, id) => {
    if (!confirm(`Bạn chắc chắn muốn xóa ${type === 'departments' ? 'phòng ban' : 'chức vụ'} này?`)) return
    setError(''); setMessage('')
    try {
      await request(`/api/hr/${type}/${id}`, { method: 'DELETE' })
      setMessage('Đã xóa dữ liệu'); await load()
    } catch (e) { setError(e.message) }
  }

  return <section>
    <div className="page-title"><div><span>CƠ CẤU TỔ CHỨC</span><h1>Phòng ban & chức vụ</h1><p>Quản lý cơ cấu tổ chức và vị trí công việc trong doanh nghiệp.</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}
    <div className="org-grid">
      <div className="panel">
        <h2>Phòng ban</h2>
        {editable && <form className="form-grid compact-form" onSubmit={saveDepartment}>
          <label>Tên phòng ban<input maxLength="120" value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} required /></label>
          <label>Mô tả<textarea maxLength="1000" value={departmentForm.description} onChange={e => setDepartmentForm({ ...departmentForm, description: e.target.value })} /></label>
          <div className="actions"><button className="primary">{departmentForm.id ? 'Cập nhật' : 'Thêm phòng ban'}</button>{departmentForm.id && <button type="button" onClick={() => setDepartmentForm({ id: null, name: '', description: '' })}>Hủy</button>}</div>
        </form>}
        <div className="table-wrap"><table><thead><tr><th>Tên</th><th>Mô tả</th>{editable && <th></th>}</tr></thead><tbody>{departments.map(x => <tr key={x.id}><td><b>{x.name}</b></td><td>{x.description || '-'}</td>{editable && <td><div className="actions"><button onClick={() => setDepartmentForm({ id: x.id, name: x.name, description: x.description || '' })}>Sửa</button><button className="danger" onClick={() => remove('departments', x.id)}>Xóa</button></div></td>}</tr>)}</tbody></table></div>
      </div>
      <div className="panel">
        <h2>Chức vụ</h2>
        {editable && <form className="form-grid compact-form" onSubmit={savePosition}>
          <label>Tên chức vụ<input maxLength="120" value={positionForm.name} onChange={e => setPositionForm({ ...positionForm, name: e.target.value })} required /></label>
          <label>Cấp bậc<input maxLength="50" value={positionForm.level} onChange={e => setPositionForm({ ...positionForm, level: e.target.value })} placeholder="Ví dụ: Nhân viên, Trưởng nhóm, Quản lý" /></label>
          <div className="actions"><button className="primary">{positionForm.id ? 'Cập nhật' : 'Thêm chức vụ'}</button>{positionForm.id && <button type="button" onClick={() => setPositionForm({ id: null, name: '', level: '' })}>Hủy</button>}</div>
        </form>}
        <div className="table-wrap"><table><thead><tr><th>Tên</th><th>Cấp bậc</th>{editable && <th></th>}</tr></thead><tbody>{positions.map(x => <tr key={x.id}><td><b>{x.name}</b></td><td>{x.level || '-'}</td>{editable && <td><div className="actions"><button onClick={() => setPositionForm({ id: x.id, name: x.name, level: x.level || '' })}>Sửa</button><button className="danger" onClick={() => remove('positions', x.id)}>Xóa</button></div></td>}</tr>)}</tbody></table></div>
      </div>
    </div>
  </section>
}

import { useEffect, useMemo, useState } from 'react'
import { Building2, Plus, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { request } from '../api'
import { canManageEmployees } from '../roles'

export default function Organization({ user }) {
  const role = user?.role || localStorage.getItem('role')
  const editable = canManageEmployees(role)
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [departmentForm, setDepartmentForm] = useState({ id: null, name: '', description: '' })
  const [positionForm, setPositionForm] = useState({ id: null, name: '', level: '' })
  const [showDepartment, setShowDepartment] = useState(false)
  const [showPosition, setShowPosition] = useState(false)
  const [query, setQuery] = useState('')
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
      setDepartmentForm({ id: null, name: '', description: '' }); setShowDepartment(false); setMessage('Đã lưu phòng ban'); await load()
    } catch (e) { setError(e.message) }
  }

  const savePosition = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    try {
      const method = positionForm.id ? 'PUT' : 'POST'
      const path = positionForm.id ? `/api/hr/positions/${positionForm.id}` : '/api/hr/positions'
      await request(path, { method, body: JSON.stringify({ name: positionForm.name, level: positionForm.level || null }) })
      setPositionForm({ id: null, name: '', level: '' }); setShowPosition(false); setMessage('Đã lưu chức vụ'); await load()
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

  const keyword = query.trim().toLowerCase()
  const filteredDepartments = useMemo(() => departments.filter(x => !keyword || `${x.name} ${x.description || ''}`.toLowerCase().includes(keyword)), [departments, keyword])
  const filteredPositions = useMemo(() => positions.filter(x => !keyword || `${x.name} ${x.level || ''}`.toLowerCase().includes(keyword)), [positions, keyword])
  const describedDepartments = departments.filter(x => x.description).length
  const leveledPositions = positions.filter(x => x.level).length

  return <section>
    <div className="page-title page-title-modern">
      <div><span>CƠ CẤU TỔ CHỨC</span><h1>Phòng ban & chức vụ</h1><p>Quản lý cấu trúc tổ chức, phòng ban và các vị trí công việc trong doanh nghiệp.</p></div>
      {editable && <div className="actions"><button onClick={() => { setDepartmentForm({ id: null, name: '', description: '' }); setShowDepartment(true) }}><Plus size={17}/> Phòng ban</button><button className="primary page-primary-action" onClick={() => { setPositionForm({ id: null, name: '', level: '' }); setShowPosition(true) }}><Plus size={17}/> Chức vụ</button></div>}
    </div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><Building2 size={20}/></div><div><span>Phòng ban</span><strong>{departments.length}</strong><small>Tổng số phòng ban</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><UsersRound size={20}/></div><div><span>Chức vụ</span><strong>{positions.length}</strong><small>Vị trí công việc</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><ShieldCheck size={20}/></div><div><span>Có mô tả</span><strong>{describedDepartments}</strong><small>Phòng ban đã hoàn thiện mô tả</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><ShieldCheck size={20}/></div><div><span>Có cấp bậc</span><strong>{leveledPositions}</strong><small>Chức vụ đã gán cấp bậc</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel">
      <div className="filter-bar organization-filter"><label className="search-box"><Search size={17}/><input placeholder="Tìm phòng ban, chức vụ, cấp bậc..." value={query} onChange={e => setQuery(e.target.value)} /></label><div></div><div></div></div>
    </div>

    <div className="org-grid management-grid">
      <div className="panel data-panel"><div className="panel-heading"><div><span>PHÒNG BAN</span><h2>Danh sách phòng ban</h2></div><small>{filteredDepartments.length} / {departments.length} phòng ban</small></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Tên phòng ban</th><th>Mô tả</th>{editable && <th>Thao tác</th>}</tr></thead><tbody>{filteredDepartments.map((x, index) => <tr key={x.id}><td>{index + 1}</td><td><b>{x.name}</b></td><td>{x.description || '-'}</td>{editable && <td><div className="actions"><button onClick={() => { setDepartmentForm({ id: x.id, name: x.name, description: x.description || '' }); setShowDepartment(true) }}>Sửa</button><button className="danger" onClick={() => remove('departments', x.id)}>Xóa</button></div></td>}</tr>)}</tbody></table></div></div>
      <div className="panel data-panel"><div className="panel-heading"><div><span>CHỨC VỤ</span><h2>Danh sách chức vụ</h2></div><small>{filteredPositions.length} / {positions.length} chức vụ</small></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Tên chức vụ</th><th>Cấp bậc</th>{editable && <th>Thao tác</th>}</tr></thead><tbody>{filteredPositions.map((x, index) => <tr key={x.id}><td>{index + 1}</td><td><b>{x.name}</b></td><td><span className="role-chip">{x.level || 'Chưa gán'}</span></td>{editable && <td><div className="actions"><button onClick={() => { setPositionForm({ id: x.id, name: x.name, level: x.level || '' }); setShowPosition(true) }}>Sửa</button><button className="danger" onClick={() => remove('positions', x.id)}>Xóa</button></div></td>}</tr>)}</tbody></table></div></div>
    </div>

    {showDepartment && <div className="modal-backdrop"><form className="modal-card employee-compact-modal" onSubmit={saveDepartment}>
      <div className="modal-head"><div><span>PHÒNG BAN</span><h2>{departmentForm.id ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}</h2></div><button type="button" onClick={() => setShowDepartment(false)}>✕</button></div>
      <div className="employee-form-table">
        <div className="employee-form-row"><label className="employee-form-cell"><span>Tên phòng ban</span><input maxLength="120" value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} required /></label><div className="employee-form-summary"><span>Nhập tên phòng ban rõ ràng, không trùng với đơn vị đã có.</span></div></div>
        <div className="employee-form-row employee-form-row-wide"><label className="employee-form-cell employee-form-cell-wide"><span>Mô tả</span><textarea maxLength="1000" value={departmentForm.description} onChange={e => setDepartmentForm({ ...departmentForm, description: e.target.value })} placeholder="Mô tả chức năng, phạm vi hoặc nhiệm vụ của phòng ban" /></label></div>
      </div>
      <div className="actions employee-form-actions"><button type="button" onClick={() => setShowDepartment(false)}>Hủy</button><button className="primary">{departmentForm.id ? 'Cập nhật' : 'Thêm phòng ban'}</button></div>
    </form></div>}

    {showPosition && <div className="modal-backdrop"><form className="modal-card employee-compact-modal" onSubmit={savePosition}>
      <div className="modal-head"><div><span>CHỨC VỤ</span><h2>{positionForm.id ? 'Cập nhật chức vụ' : 'Thêm chức vụ'}</h2></div><button type="button" onClick={() => setShowPosition(false)}>✕</button></div>
      <div className="employee-form-table"><div className="employee-form-row"><label className="employee-form-cell"><span>Tên chức vụ</span><input maxLength="120" value={positionForm.name} onChange={e => setPositionForm({ ...positionForm, name: e.target.value })} required /></label><label className="employee-form-cell"><span>Cấp bậc</span><input maxLength="50" value={positionForm.level} onChange={e => setPositionForm({ ...positionForm, level: e.target.value })} placeholder="Nhân viên, Trưởng nhóm, Quản lý..." /></label></div></div>
      <div className="actions employee-form-actions"><button type="button" onClick={() => setShowPosition(false)}>Hủy</button><button className="primary">{positionForm.id ? 'Cập nhật' : 'Thêm chức vụ'}</button></div>
    </form></div>}
  </section>
}

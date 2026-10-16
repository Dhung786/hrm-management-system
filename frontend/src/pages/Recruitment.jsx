import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Plus, Search, UserCheck, UsersRound, UserRoundSearch } from 'lucide-react'
import { request } from '../api'

const jobBlank = { title: '', department: '', description: '', openings: 1, status: 'OPEN' }
const candidateBlank = { full_name: '', email: '', phone: '', job_posting_id: '', stage: 'APPLIED', note: '' }
const jobStatusLabel = { OPEN: 'Đang tuyển', PAUSED: 'Tạm dừng', CLOSED: 'Đã đóng' }
const stageLabel = { APPLIED: 'Đã ứng tuyển', SCREENING: 'Sàng lọc', INTERVIEW: 'Phỏng vấn', OFFER: 'Đề nghị', HIRED: 'Đã tuyển', REJECTED: 'Loại' }

export default function Recruitment({ user }) {
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobForm, setJobForm] = useState(jobBlank)
  const [candidateForm, setCandidateForm] = useState(candidateBlank)
  const [showJob, setShowJob] = useState(false)
  const [showCandidate, setShowCandidate] = useState(false)
  const [query, setQuery] = useState('')
  const [jobStatus, setJobStatus] = useState('ALL')
  const [candidateStage, setCandidateStage] = useState('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [jobsData, candidatesData] = await Promise.all([request('/api/talent/jobs'), request('/api/talent/candidates')])
      setJobs(jobsData); setCandidates(candidatesData)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const jobMap = useMemo(() => Object.fromEntries(jobs.map(x => [x.id, x.title])), [jobs])

  const createJob = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (jobForm.title.trim().length < 2) return setError('Tên vị trí tuyển dụng phải có ít nhất 2 ký tự')
    if (Number(jobForm.openings) < 1 || Number(jobForm.openings) > 100) return setError('Số lượng tuyển phải từ 1 đến 100')
    try {
      await request('/api/talent/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...jobForm,
          status: 'OPEN',
          openings: Number(jobForm.openings),
          department: jobForm.department || null,
          description: jobForm.description || null,
        }),
      })
      setJobForm(jobBlank); setShowJob(false); setMessage('Đã tạo tin tuyển dụng ở trạng thái Đang tuyển'); await load()
    } catch (e) { setError(e.message) }
  }

  const updateJobStatus = async (job, status) => {
    setError(''); setMessage('')
    try {
      await request(`/api/talent/jobs/${job.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: job.title,
          department: job.department || null,
          description: job.description || null,
          openings: Number(job.openings),
          status,
        }),
      })
      setMessage(`Đã chuyển tin tuyển dụng sang trạng thái ${jobStatusLabel[status]}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  const createCandidate = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (/\d/.test(candidateForm.full_name)) return setError('Họ tên ứng viên không được chứa chữ số')
    if (!/^\S+@\S+\.\S+$/.test(candidateForm.email)) return setError('Email ứng viên không hợp lệ')
    if (candidateForm.phone && !/^\d{9,10}$/.test(candidateForm.phone)) return setError('Số điện thoại chỉ được gồm 9-10 chữ số và không được quá 10 số')
    try {
      await request('/api/talent/candidates', {
        method: 'POST',
        body: JSON.stringify({
          ...candidateForm,
          stage: 'APPLIED',
          phone: candidateForm.phone || null,
          job_posting_id: candidateForm.job_posting_id ? Number(candidateForm.job_posting_id) : null,
          note: candidateForm.note || null,
        }),
      })
      setCandidateForm(candidateBlank); setShowCandidate(false); setMessage('Đã thêm ứng viên ở giai đoạn Đã ứng tuyển'); await load()
    } catch (e) { setError(e.message) }
  }

  const updateCandidateStage = async (candidate, stage) => {
    setError(''); setMessage('')
    try {
      await request(`/api/talent/candidates/${candidate.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone || null,
          job_posting_id: candidate.job_posting_id || null,
          stage,
          note: candidate.note || null,
        }),
      })
      setMessage(`Đã chuyển ứng viên sang giai đoạn ${stageLabel[stage]}`)
      await load()
    } catch (e) { setError(e.message) }
  }

  const keyword = query.trim().toLowerCase()
  const filteredJobs = useMemo(() => jobs.filter(x => {
    const matchesText = !keyword || `${x.title} ${x.department || ''} ${x.description || ''}`.toLowerCase().includes(keyword)
    const matchesStatus = jobStatus === 'ALL' || x.status === jobStatus
    return matchesText && matchesStatus
  }), [jobs, keyword, jobStatus])
  const filteredCandidates = useMemo(() => candidates.filter(x => {
    const matchesText = !keyword || `${x.full_name} ${x.email} ${x.phone || ''} ${jobMap[x.job_posting_id] || ''}`.toLowerCase().includes(keyword)
    const matchesStage = candidateStage === 'ALL' || x.stage === candidateStage
    return matchesText && matchesStage
  }), [candidates, keyword, candidateStage, jobMap])

  const openJobs = jobs.filter(x => x.status === 'OPEN').length
  const unassignedCandidates = candidates.filter(x => !x.job_posting_id).length
  const hired = candidates.filter(x => x.stage === 'HIRED').length

  return <section>
    <div className="page-title page-title-modern">
      <div><span>TUYỂN DỤNG</span><h1>Tuyển dụng & ứng viên</h1><p>Quản lý nhu cầu tuyển dụng, danh sách ứng viên và tiến trình tuyển người.</p></div>
      <div className="actions"><button onClick={() => setShowCandidate(true)}><Plus size={17}/> Ứng viên</button><button className="primary page-primary-action" onClick={() => setShowJob(true)}><Plus size={17}/> Tin tuyển dụng</button></div>
    </div>

    <div className="dashboard-stats">
      <div className="dashboard-stat"><div className="stat-icon stat-icon-1"><BriefcaseBusiness size={20}/></div><div><span>Vị trí tuyển</span><strong>{jobs.length}</strong><small>Tổng tin tuyển dụng</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-2"><UserRoundSearch size={20}/></div><div><span>Đang tuyển</span><strong>{openJobs}</strong><small>Vị trí đang mở</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-3"><UsersRound size={20}/></div><div><span>Chưa gán vị trí</span><strong>{unassignedCandidates}</strong><small>{unassignedCandidates ? 'Ứng viên cần được gán vào tin tuyển dụng' : 'Không có ứng viên cần xử lý'}</small></div></div>
      <div className="dashboard-stat"><div className="stat-icon stat-icon-4"><UserCheck size={20}/></div><div><span>Đã tuyển</span><strong>{hired}</strong><small>Ứng viên đã nhận việc</small></div></div>
    </div>

    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="panel data-panel management-list-panel">
      <div className="filter-bar"><label className="search-box"><Search size={17}/><input placeholder="Tìm vị trí, phòng ban, ứng viên..." value={query} onChange={e => setQuery(e.target.value)} /></label><select value={jobStatus} onChange={e => setJobStatus(e.target.value)}><option value="ALL">Tất cả tin tuyển dụng</option><option value="OPEN">Đang tuyển</option><option value="PAUSED">Tạm dừng</option><option value="CLOSED">Đã đóng</option></select><select value={candidateStage} onChange={e => setCandidateStage(e.target.value)}><option value="ALL">Tất cả ứng viên</option>{Object.entries(stageLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    </div>

    <div className="org-grid management-grid">
      <div className="panel data-panel"><div className="panel-heading"><div><span>VỊ TRÍ TUYỂN</span><h2>Danh sách tin tuyển dụng</h2></div><small>{filteredJobs.length} / {jobs.length} vị trí</small></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Vị trí</th><th>Phòng ban</th><th>Số lượng</th><th>Trạng thái</th></tr></thead><tbody>{filteredJobs.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{x.title}</b><br/><small>{x.description || 'Chưa có mô tả'}</small></td><td>{x.department || '-'}</td><td>{x.openings}</td><td><select value={x.status} onChange={e => updateJobStatus(x, e.target.value)}><option value="OPEN">Đang tuyển</option><option value="PAUSED">Tạm dừng</option><option value="CLOSED">Đã đóng</option></select></td></tr>)}</tbody></table></div></div>
      <div className="panel data-panel"><div className="panel-heading"><div><span>ỨNG VIÊN</span><h2>Danh sách ứng viên</h2></div><small>{filteredCandidates.length} / {candidates.length} ứng viên</small></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Họ tên</th><th>Liên hệ</th><th>Vị trí</th><th>Giai đoạn</th></tr></thead><tbody>{filteredCandidates.map((x,index) => <tr key={x.id}><td>{index + 1}</td><td><b>{x.full_name}</b></td><td>{x.email}<br/><small>{x.phone || '-'}</small></td><td>{jobMap[x.job_posting_id] || '-'}</td><td><select value={x.stage} onChange={e => updateCandidateStage(x, e.target.value)}>{Object.entries(stageLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div></div>
    </div>

    {showJob && <div className="modal-backdrop"><form className="modal-card employee-compact-modal" onSubmit={createJob}>
      <div className="modal-head"><div><span>TIN TUYỂN DỤNG</span><h2>Tạo vị trí tuyển mới</h2></div><button type="button" onClick={() => setShowJob(false)}>✕</button></div>
      <div className="employee-form-table">
        <div className="employee-form-row"><label className="employee-form-cell"><span>Vị trí</span><input maxLength={160} value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required /></label><label className="employee-form-cell"><span>Phòng ban</span><input maxLength={120} value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} /></label></div>
        <div className="employee-form-row"><label className="employee-form-cell"><span>Số lượng</span><input type="number" min="1" max="100" value={jobForm.openings} onChange={e => setJobForm({ ...jobForm, openings: e.target.value })} /></label><div className="employee-form-summary"><span>Tin mới mặc định ở trạng thái Đang tuyển. Trạng thái được thay đổi trực tiếp tại danh sách tin tuyển dụng bên dưới.</span></div></div>
        <div className="employee-form-row employee-form-row-wide"><label className="employee-form-cell employee-form-cell-wide"><span>Mô tả</span><textarea maxLength={3000} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Mô tả yêu cầu và nội dung công việc" /></label></div>
      </div>
      <div className="actions employee-form-actions"><button type="button" onClick={() => setShowJob(false)}>Hủy</button><button className="primary">Tạo tin</button></div>
    </form></div>}

    {showCandidate && <div className="modal-backdrop"><form className="modal-card employee-compact-modal" onSubmit={createCandidate}>
      <div className="modal-head"><div><span>ỨNG VIÊN</span><h2>Thêm ứng viên mới</h2></div><button type="button" onClick={() => setShowCandidate(false)}>✕</button></div>
      <div className="employee-form-table">
        <div className="employee-form-row"><label className="employee-form-cell"><span>Họ tên</span><input maxLength={160} value={candidateForm.full_name} onChange={e => setCandidateForm({ ...candidateForm, full_name: e.target.value })} required /></label><label className="employee-form-cell"><span>Email</span><input type="email" maxLength={160} value={candidateForm.email} onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })} required /></label></div>
        <div className="employee-form-row"><label className="employee-form-cell"><span>Điện thoại</span><input inputMode="numeric" maxLength={10} value={candidateForm.phone} onChange={e => setCandidateForm({ ...candidateForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9-10 chữ số" /></label><label className="employee-form-cell"><span>Vị trí</span><select value={candidateForm.job_posting_id} onChange={e => setCandidateForm({ ...candidateForm, job_posting_id: e.target.value })}><option value="">-- Chưa gán --</option>{jobs.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label></div>
        <div className="employee-form-row employee-form-row-wide"><label className="employee-form-cell employee-form-cell-wide"><span>Ghi chú</span><textarea maxLength={2000} value={candidateForm.note} onChange={e => setCandidateForm({ ...candidateForm, note: e.target.value })} placeholder="Ghi chú hoặc thông tin bổ sung" /></label></div>
        <div className="employee-form-row employee-form-row-last"><div className="employee-form-summary"><span>Ứng viên mới mặc định ở giai đoạn Đã ứng tuyển. Giai đoạn tuyển dụng được cập nhật trực tiếp tại danh sách ứng viên.</span></div></div>
      </div>
      <div className="actions employee-form-actions"><button type="button" onClick={() => setShowCandidate(false)}>Hủy</button><button className="primary">Thêm ứng viên</button></div>
    </form></div>}
  </section>
}

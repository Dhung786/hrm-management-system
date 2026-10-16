import { useEffect, useMemo, useState } from 'react'
import { request } from '../api'

const jobBlank = { title: '', department: '', description: '', openings: 1, status: 'OPEN' }
const candidateBlank = { full_name: '', email: '', phone: '', job_posting_id: '', stage: 'APPLIED', note: '' }

export default function Recruitment() {
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [jobForm, setJobForm] = useState(jobBlank)
  const [candidateForm, setCandidateForm] = useState(candidateBlank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const [jobsData, candidatesData] = await Promise.all([request('/api/talent/jobs'), request('/api/talent/candidates')])
      setJobs(jobsData)
      setCandidates(candidatesData)
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  const jobMap = useMemo(() => Object.fromEntries(jobs.map(x => [x.id, x.title])), [jobs])

  const createJob = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (jobForm.title.trim().length < 2) return setError('Tên vị trí tuyển dụng phải có ít nhất 2 ký tự')
    if (Number(jobForm.openings) < 1 || Number(jobForm.openings) > 100) return setError('Số lượng tuyển phải từ 1 đến 100')
    try {
      await request('/api/talent/jobs', { method: 'POST', body: JSON.stringify({ ...jobForm, openings: Number(jobForm.openings), department: jobForm.department || null, description: jobForm.description || null }) })
      setJobForm(jobBlank); setMessage('Đã tạo tin tuyển dụng'); await load()
    } catch (e) { setError(e.message) }
  }

  const createCandidate = async (e) => {
    e.preventDefault(); setError(''); setMessage('')
    if (/\d/.test(candidateForm.full_name)) return setError('Họ tên ứng viên không được chứa chữ số')
    if (!/^\S+@\S+\.\S+$/.test(candidateForm.email)) return setError('Email ứng viên không hợp lệ')
    if (candidateForm.phone && !/^\d{9,10}$/.test(candidateForm.phone)) return setError('Số điện thoại chỉ được gồm 9-10 chữ số và không được quá 10 số')
    try {
      await request('/api/talent/candidates', { method: 'POST', body: JSON.stringify({ ...candidateForm, phone: candidateForm.phone || null, job_posting_id: candidateForm.job_posting_id ? Number(candidateForm.job_posting_id) : null, note: candidateForm.note || null }) })
      setCandidateForm(candidateBlank); setMessage('Đã thêm ứng viên'); await load()
    } catch (e) { setError(e.message) }
  }

  return <section>
    <div className="page-title"><div><span>TUYỂN DỤNG</span><h1>Tuyển dụng & ứng viên</h1><p>Tạo vị trí tuyển, theo dõi ứng viên và trạng thái pipeline.</p></div></div>
    {error && <div className="error notice">{error}</div>}{message && <div className="success notice">{message}</div>}

    <div className="split">
      <div className="panel"><h2>Tạo tin tuyển dụng</h2><form className="form-grid" onSubmit={createJob}>
        <label>Vị trí<input maxLength={160} value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required /></label>
        <label>Phòng ban<input maxLength={120} value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} /></label>
        <label>Số lượng<input type="number" min="1" max="100" value={jobForm.openings} onChange={e => setJobForm({ ...jobForm, openings: e.target.value })} /></label>
        <label>Trạng thái<select value={jobForm.status} onChange={e => setJobForm({ ...jobForm, status: e.target.value })}><option value="OPEN">Đang tuyển</option><option value="PAUSED">Tạm dừng</option><option value="CLOSED">Đã đóng</option></select></label>
        <label>Mô tả<textarea maxLength={3000} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} /></label>
        <button className="primary">Tạo tin</button>
      </form></div>
      <div className="panel grow"><h2>Vị trí đang quản lý</h2><div className="table-wrap"><table><thead><tr><th>Vị trí</th><th>Phòng ban</th><th>Số lượng</th><th>Trạng thái</th></tr></thead><tbody>{jobs.map(x => <tr key={x.id}><td><b>{x.title}</b></td><td>{x.department || '-'}</td><td>{x.openings}</td><td>{x.status}</td></tr>)}</tbody></table></div></div>
    </div>

    <div className="split">
      <div className="panel"><h2>Thêm ứng viên</h2><form className="form-grid" onSubmit={createCandidate}>
        <label>Họ tên<input maxLength={160} value={candidateForm.full_name} onChange={e => setCandidateForm({ ...candidateForm, full_name: e.target.value })} required /></label>
        <label>Email<input type="email" maxLength={160} value={candidateForm.email} onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })} required /></label>
        <label>Điện thoại<input inputMode="numeric" maxLength={10} value={candidateForm.phone} onChange={e => setCandidateForm({ ...candidateForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Tối đa 10 chữ số" /></label>
        <label>Vị trí<select value={candidateForm.job_posting_id} onChange={e => setCandidateForm({ ...candidateForm, job_posting_id: e.target.value })}><option value="">-- Chưa gán --</option>{jobs.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
        <label>Giai đoạn<select value={candidateForm.stage} onChange={e => setCandidateForm({ ...candidateForm, stage: e.target.value })}><option value="APPLIED">Đã ứng tuyển</option><option value="SCREENING">Sàng lọc</option><option value="INTERVIEW">Phỏng vấn</option><option value="OFFER">Đề nghị</option><option value="HIRED">Đã tuyển</option><option value="REJECTED">Loại</option></select></label>
        <label>Ghi chú<textarea maxLength={2000} value={candidateForm.note} onChange={e => setCandidateForm({ ...candidateForm, note: e.target.value })} /></label>
        <button className="primary">Thêm ứng viên</button>
      </form></div>
      <div className="panel grow"><h2>Danh sách ứng viên</h2><div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Liên hệ</th><th>Vị trí</th><th>Giai đoạn</th></tr></thead><tbody>{candidates.map(x => <tr key={x.id}><td><b>{x.full_name}</b></td><td>{x.email}<br /><small>{x.phone || '-'}</small></td><td>{jobMap[x.job_posting_id] || '-'}</td><td>{x.stage}</td></tr>)}</tbody></table></div></div>
    </div>
  </section>
}

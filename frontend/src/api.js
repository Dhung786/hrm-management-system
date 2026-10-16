const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = 'Có lỗi xảy ra'
    try { detail = (await res.json()).detail || detail } catch {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

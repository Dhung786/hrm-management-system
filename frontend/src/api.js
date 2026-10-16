const API = import.meta.env.VITE_API_URL ?? ''

function formatApiError(payload) {
  const detail = payload?.detail

  if (!detail) return 'Có lỗi xảy ra'
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message || JSON.stringify(item))
      .join('; ')
  }

  if (typeof detail === 'object') {
    return detail.message || detail.msg || JSON.stringify(detail)
  }

  return String(detail)
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `Yêu cầu thất bại (${res.status})`
    try {
      message = formatApiError(await res.json())
    } catch {
      // Keep the HTTP status fallback when the response body is not JSON.
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

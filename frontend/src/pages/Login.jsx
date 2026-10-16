import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { request } from '../api'
import { roleLabel } from '../roles'

const LOGIN_IMAGE = 'data:image/webp;base64,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';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: username.trim(), password }),
      })

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('role_label', roleLabel(data.role))

      const me = await request('/api/auth/me')
      localStorage.setItem('current_user', JSON.stringify(me))
      onLogin(me)
    } catch (err) {
      localStorage.removeItem('token')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return <div className="hrm-login-page">
    <style>{`
      .hrm-login-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 28px;
        background:
          radial-gradient(circle at 15% 20%, rgba(72, 110, 136, .18), transparent 28%),
          linear-gradient(145deg, #0f1113 0%, #15191d 55%, #111315 100%);
      }
      .hrm-login-shell {
        width: min(1180px, 96vw);
        min-height: 560px;
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(380px, .75fr);
        overflow: hidden;
        border: 1px solid #343a40;
        border-radius: 24px;
        background: #121416;
        box-shadow: 0 30px 90px rgba(0, 0, 0, .5);
      }
      .hrm-login-visual {
        position: relative;
        min-height: 560px;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
      }
      .hrm-login-visual::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(7, 12, 16, .18) 0%, rgba(7, 12, 16, .35) 60%, rgba(7, 12, 16, .72) 100%),
          linear-gradient(180deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .5));
      }
      .hrm-login-welcome {
        position: absolute;
        z-index: 1;
        left: 42px;
        right: 42px;
        bottom: 42px;
        max-width: 680px;
      }
      .hrm-login-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 11px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.28);
        background: rgba(10, 15, 19, .42);
        backdrop-filter: blur(8px);
        color: #f4f6f8;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.6px;
      }
      .hrm-login-welcome h1 {
        margin: 16px 0 0;
        color: #fff;
        font-size: clamp(30px, 3vw, 46px);
        line-height: 1.12;
        text-shadow: 0 4px 22px rgba(0,0,0,.45);
      }
      .hrm-login-form-side {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 44px 38px;
        background: linear-gradient(180deg, #181b1e 0%, #111315 100%);
      }
      .hrm-login-card {
        width: 100%;
        max-width: 390px;
        display: grid;
        gap: 20px;
      }
      .hrm-login-card-head span {
        display: block;
        color: #f04b57;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.7px;
        margin-bottom: 7px;
      }
      .hrm-login-card-head h2 {
        margin: 0;
        font-size: 28px;
        color: #fff;
      }
      .hrm-login-card label {
        display: grid;
        gap: 8px;
        color: #d9dde2;
        font-size: 13px;
        font-weight: 650;
      }
      .hrm-login-input {
        position: relative;
        display: flex;
        align-items: center;
      }
      .hrm-login-input > svg {
        position: absolute;
        left: 14px;
        color: #8d98a5;
        pointer-events: none;
      }
      .hrm-login-input input {
        width: 100%;
        min-height: 54px;
        padding: 0 48px 0 45px;
        border-radius: 12px;
        border: 1px solid #3c434a;
        background: #0f1113;
        color: #fff;
        font-size: 14px;
        transition: .18s ease;
      }
      .hrm-login-input input::placeholder { color: #66717d; }
      .hrm-login-input input:focus {
        border-color: #e04a55;
        box-shadow: 0 0 0 4px rgba(224, 74, 85, .1);
      }
      .hrm-login-eye {
        position: absolute;
        right: 8px;
        width: 36px;
        height: 36px;
        padding: 0;
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        color: #9aa4af;
        border-radius: 9px;
      }
      .hrm-login-eye:hover { background: #23282d; color: #fff; }
      .hrm-login-card .error {
        margin: -2px 0 0;
        border: 1px solid #6b292b;
        background: #321719;
        color: #ffaaa9;
        border-radius: 10px;
        font-size: 13px;
      }
      .hrm-login-submit {
        min-height: 54px;
        margin-top: 2px;
        border-radius: 12px !important;
        border: 1px solid #f04b57 !important;
        background: linear-gradient(135deg, #f2525d, #dc3f49) !important;
        color: #fff;
        font-size: 14px;
        font-weight: 800 !important;
        box-shadow: 0 12px 28px rgba(220, 63, 73, .24);
      }
      .hrm-login-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.05);
      }
      @media (max-width: 900px) {
        .hrm-login-page { padding: 18px; }
        .hrm-login-shell {
          width: min(620px, 96vw);
          grid-template-columns: 1fr;
        }
        .hrm-login-visual { min-height: 310px; }
        .hrm-login-welcome { left: 26px; right: 26px; bottom: 26px; }
        .hrm-login-form-side { padding: 32px 24px; }
      }
      @media (max-width: 560px) {
        .hrm-login-page { padding: 0; }
        .hrm-login-shell {
          width: 100%;
          min-height: 100vh;
          border: 0;
          border-radius: 0;
        }
        .hrm-login-visual { min-height: 235px; }
        .hrm-login-welcome h1 { font-size: 27px; }
        .hrm-login-form-side { padding: 28px 20px 36px; }
      }
    `}</style>

    <div className="hrm-login-shell">
      <div className="hrm-login-visual" style={{ backgroundImage: `url(${LOGIN_IMAGE})` }}>
        <div className="hrm-login-welcome">
          <span className="hrm-login-kicker">HRM MANAGEMENT</span>
          <h1>Chào mừng đến với hệ thống quản lý nhân viên (HRM)</h1>
        </div>
      </div>

      <div className="hrm-login-form-side">
        <form className="hrm-login-card" onSubmit={submit}>
          <div className="hrm-login-card-head">
            <span>ĐĂNG NHẬP HỆ THỐNG</span>
            <h2>Đăng nhập</h2>
          </div>

          <label>
            Tên tài khoản
            <div className="hrm-login-input">
              <UserRound size={18} />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Nhập tên tài khoản"
                required
                autoFocus
              />
            </div>
          </label>

          <label>
            Mật khẩu
            <div className="hrm-login-input">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                className="hrm-login-eye"
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="error">{error}</div>}

          <button className="primary hrm-login-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  </div>
}

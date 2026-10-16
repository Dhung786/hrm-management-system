import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound, UsersRound } from 'lucide-react'
import { request } from '../api'
import { roleLabel } from '../roles'

const LOGIN_IMAGE = 'data:image/webp;base64,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'

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

  return <div className="hrm-login-page" style={{ '--login-image': `url(${LOGIN_IMAGE})` }}>
    <style>{`
      .hrm-login-page {
        min-height: 100vh;
        position: relative;
        overflow: hidden;
        color: #f7f8fa;
        display: grid;
        align-items: center;
        background-image:
          linear-gradient(90deg, rgba(4, 10, 16, .34) 0%, rgba(4, 10, 16, .44) 42%, rgba(4, 10, 16, .78) 70%, rgba(4, 10, 16, .92) 100%),
          var(--login-image);
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        isolation: isolate;
      }
      .hrm-login-page::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          radial-gradient(circle at 70% 50%, rgba(13, 41, 61, .12), transparent 30%),
          linear-gradient(180deg, rgba(0, 0, 0, .08), rgba(0, 0, 0, .34));
      }
      .hrm-login-shell {
        width: min(1320px, calc(100% - 72px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(420px, .72fr);
        gap: clamp(42px, 7vw, 110px);
        align-items: center;
      }
      .hrm-login-copy {
        align-self: start;
        margin-top: clamp(26px, 8vh, 92px);
        max-width: 700px;
        text-shadow: 0 3px 20px rgba(0, 0, 0, .62);
      }
      .hrm-login-copy h1 {
        margin: 0;
        font-size: clamp(38px, 4.25vw, 66px);
        line-height: 1.08;
        letter-spacing: -.035em;
        font-weight: 850;
      }
      .hrm-login-copy h1 span {
        color: #ff555e;
        display: block;
        margin-top: 8px;
      }
      .hrm-login-copy p {
        margin: 24px 0 0;
        max-width: 630px;
        color: rgba(237, 242, 247, .82);
        font-size: clamp(15px, 1.18vw, 19px);
        line-height: 1.7;
      }
      .hrm-login-card {
        width: 100%;
        padding: 34px;
        border-radius: 24px;
        border: 1px solid rgba(176, 199, 219, .32);
        background: linear-gradient(145deg, rgba(23, 36, 49, .78), rgba(11, 21, 31, .87));
        box-shadow: 0 34px 80px rgba(0, 0, 0, .44), inset 0 1px 0 rgba(255,255,255,.06);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
      }
      .hrm-login-brand {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 30px;
      }
      .hrm-login-brand-icon {
        width: 62px;
        height: 62px;
        border-radius: 17px;
        display: grid;
        place-items: center;
        color: #ff5962;
        background: rgba(255, 80, 90, .1);
        border: 1px solid rgba(255, 89, 98, .18);
      }
      .hrm-login-brand strong {
        display: block;
        font-size: 34px;
        line-height: 1;
        letter-spacing: -.02em;
      }
      .hrm-login-brand span {
        display: block;
        margin-top: 7px;
        color: rgba(224, 232, 239, .67);
        font-size: 13px;
      }
      .hrm-login-form {
        display: grid;
        gap: 16px;
      }
      .hrm-login-field {
        position: relative;
        display: flex;
        align-items: center;
      }
      .hrm-login-field > svg {
        position: absolute;
        left: 17px;
        color: #a8b8c7;
        pointer-events: none;
      }
      .hrm-login-field input {
        width: 100%;
        height: 58px;
        padding: 0 52px 0 50px;
        border-radius: 13px;
        border: 1px solid rgba(178, 201, 220, .2);
        outline: none;
        background: rgba(45, 62, 78, .48);
        color: #fff;
        font-size: 15px;
        transition: .18s ease;
      }
      .hrm-login-field input::placeholder { color: #a6b2bd; }
      .hrm-login-field input:focus {
        border-color: rgba(255, 90, 100, .72);
        background: rgba(48, 66, 83, .62);
        box-shadow: 0 0 0 4px rgba(255, 82, 93, .1);
      }
      .hrm-login-eye {
        position: absolute;
        right: 10px;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: transparent;
        color: #a9b7c4;
      }
      .hrm-login-eye:hover { background: rgba(255,255,255,.07); color: #fff; }
      .hrm-login-error {
        padding: 11px 13px;
        border-radius: 10px;
        background: rgba(104, 22, 27, .72);
        border: 1px solid rgba(255, 106, 112, .32);
        color: #ffc1c4;
        font-size: 13px;
      }
      .hrm-login-submit {
        height: 58px;
        margin-top: 5px;
        border: 0 !important;
        border-radius: 13px !important;
        background: linear-gradient(135deg, #ff515c, #ef343f) !important;
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        box-shadow: 0 14px 34px rgba(239, 52, 63, .28);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        transition: .18s ease;
      }
      .hrm-login-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.06);
        box-shadow: 0 18px 38px rgba(239, 52, 63, .36);
      }
      @media (max-width: 980px) {
        .hrm-login-page {
          background-position: 42% center;
          background-image:
            linear-gradient(180deg, rgba(4,10,16,.56), rgba(4,10,16,.88)),
            var(--login-image);
        }
        .hrm-login-shell {
          width: min(680px, calc(100% - 34px));
          grid-template-columns: 1fr;
          gap: 28px;
          padding: 44px 0;
        }
        .hrm-login-copy { margin-top: 0; text-align: center; max-width: none; }
        .hrm-login-copy p { margin-left: auto; margin-right: auto; }
      }
      @media (max-width: 560px) {
        .hrm-login-shell { width: min(100% - 24px, 520px); padding: 28px 0; }
        .hrm-login-copy h1 { font-size: 34px; }
        .hrm-login-copy p { margin-top: 15px; font-size: 14px; }
        .hrm-login-card { padding: 24px 20px; border-radius: 20px; }
        .hrm-login-brand-icon { width: 52px; height: 52px; border-radius: 14px; }
        .hrm-login-brand strong { font-size: 28px; }
      }
    `}</style>

    <div className="hrm-login-shell">
      <div className="hrm-login-copy">
        <h1>
          Chào mừng đến với hệ thống
          <span>quản lý nhân viên (HRM)</span>
        </h1>
        <p>Đăng nhập để tiếp tục quản lý nhân sự, chấm công và hồ sơ nội bộ.</p>
      </div>

      <form className="hrm-login-card" onSubmit={submit}>
        <div className="hrm-login-brand">
          <div className="hrm-login-brand-icon"><UsersRound size={34} strokeWidth={2.2} /></div>
          <div>
            <strong>HRM</strong>
            <span>Kết nối con người - Kiến tạo giá trị</span>
          </div>
        </div>

        <div className="hrm-login-form">
          <div className="hrm-login-field">
            <UserRound size={19} />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Tên tài khoản"
              required
              autoFocus
            />
          </div>

          <div className="hrm-login-field">
            <LockKeyhole size={19} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Mật khẩu"
              required
            />
            <button
              className="hrm-login-eye"
              type="button"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && <div className="hrm-login-error">{error}</div>}

          <button className="primary hrm-login-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </div>
  </div>
}

import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { request } from '../api'
import { roleLabel } from '../roles'

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

  return <div className="login-wrap login-wrap-polished">
    <style>{`
      .login-wrap-polished {
        background:
          radial-gradient(circle at 50% 20%, rgba(111, 47, 43, .28), transparent 34%),
          radial-gradient(circle at 15% 85%, rgba(72, 34, 30, .16), transparent 28%),
          linear-gradient(145deg, #16110f 0%, #100f0f 48%, #171211 100%);
        position: relative;
        overflow: hidden;
      }
      .login-wrap-polished::before,
      .login-wrap-polished::after {
        content: '';
        position: absolute;
        width: 340px;
        height: 340px;
        border-radius: 50%;
        filter: blur(90px);
        pointer-events: none;
        opacity: .2;
      }
      .login-wrap-polished::before { background: #8f342f; top: -150px; right: 12%; }
      .login-wrap-polished::after { background: #4d211e; bottom: -180px; left: 8%; }

      .minimal-login-card {
        width: min(460px, calc(100vw - 36px));
        padding: 38px;
        gap: 22px;
        background: linear-gradient(180deg, rgba(30, 27, 25, .98), rgba(20, 18, 17, .98));
        border: 1px solid #51413b;
        border-radius: 22px;
        box-shadow: 0 28px 80px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.025);
        position: relative;
        z-index: 1;
      }
      .minimal-login-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 34px;
        right: 34px;
        height: 3px;
        border-radius: 0 0 6px 6px;
        background: linear-gradient(90deg, transparent, #f04b57, transparent);
      }
      .minimal-login-card label {
        display: grid;
        gap: 9px;
        color: #e5deda;
        font-size: 13px;
        font-weight: 650;
      }
      .minimal-login-input {
        position: relative;
        display: flex;
        align-items: center;
      }
      .minimal-login-input > svg {
        position: absolute;
        left: 15px;
        color: #8f8580;
        pointer-events: none;
      }
      .minimal-login-input input {
        width: 100%;
        min-height: 54px;
        padding: 0 48px 0 46px;
        border-radius: 12px;
        border: 1px solid #403936;
        background: #101213;
        color: #fff;
        font-size: 14px;
        transition: .18s ease;
      }
      .minimal-login-input input::placeholder { color: #6f747a; }
      .minimal-login-input input:focus {
        border-color: #e24f59;
        box-shadow: 0 0 0 4px rgba(226, 79, 89, .10);
        background: #121416;
      }
      .login-eye {
        position: absolute;
        right: 9px;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 0;
        display: grid;
        place-items: center;
        background: transparent;
        color: #9b918c;
        border-radius: 9px;
      }
      .login-eye:hover { background: #26211f; color: #fff; }
      .minimal-login-card .error {
        margin: -4px 0 0;
        border: 1px solid #6b292b;
        background: #321719;
        color: #ffaaa9;
        border-radius: 10px;
        font-size: 13px;
      }
      .minimal-login-submit {
        min-height: 54px;
        margin-top: 2px;
        border-radius: 12px !important;
        border: 1px solid #f04b57 !important;
        background: linear-gradient(135deg, #f2525d, #dc3f49) !important;
        color: white;
        font-weight: 800 !important;
        font-size: 14px;
        letter-spacing: .15px;
        box-shadow: 0 10px 26px rgba(220, 63, 73, .22);
        transition: .18s ease;
      }
      .minimal-login-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 14px 32px rgba(220, 63, 73, .3);
        filter: brightness(1.05);
      }
      @media (max-width: 600px) {
        .minimal-login-card { padding: 28px 22px; border-radius: 18px; }
      }
    `}</style>

    <form className="login-card minimal-login-card" onSubmit={submit}>
      <label>
        Tên tài khoản
        <div className="minimal-login-input">
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
        <div className="minimal-login-input">
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
            className="login-eye"
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

      <button className="primary minimal-login-submit" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  </div>
}

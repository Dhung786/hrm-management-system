import { useState } from 'react'
import { request } from '../api'
export default function Login({onLogin}){
  const [email,setEmail]=useState('admin@hr.local'); const [password,setPassword]=useState('Admin@123'); const [error,setError]=useState('')
  const submit=async(e)=>{e.preventDefault();setError('');try{const data=await request('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('token',data.access_token);localStorage.setItem('role',data.role);onLogin()}catch(err){setError(err.message)}}
  return <div className="login-wrap"><form className="login-card" onSubmit={submit}><div className="login-logo">HR</div><h1>Đăng nhập HRM</h1><p>Quản lý nhân sự doanh nghiệp</p><label>Email<input value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mật khẩu<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="error">{error}</div>}<button className="primary">Đăng nhập</button><small>Tài khoản demo: admin@hr.local / Admin@123</small></form></div>
}

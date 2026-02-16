'use client';
import { useState } from 'react';
export default function RegisterPage() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [err,setErr]=useState<string|null>(null);
  async function submit(e:React.FormEvent){e.preventDefault();setErr(null);
    const base=process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
    const res=await fetch(`${base}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await res.json(); if(!res.ok){setErr(data?.error?.message??'Register failed');return;}
    localStorage.setItem('accessToken',data.accessToken); window.location.href='/orgs';
  }
  return (<main><h1>Register</h1><form onSubmit={submit}>
    <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
    <button type="submit">Register</button></form>{err&&<p style={{color:'crimson'}}>{err}</p>}
    <p><a href="/login">Login</a></p></main>);
}

'use client';
import { useState } from 'react';
export default function LoginPage() {
  const [email,setEmail]=useState('demo.organiser@publeague.local'); const [password,setPassword]=useState('demo12345'); const [err,setErr]=useState<string|null>(null);
  async function submit(e:React.FormEvent){e.preventDefault();setErr(null);
    const base=process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';
    const res=await fetch(`${base}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const data=await res.json(); if(!res.ok){setErr(data?.error?.message??'Login failed');return;}
    localStorage.setItem('accessToken',data.accessToken); window.location.href='/orgs';
  }
  return (<main><h1>Login</h1><form onSubmit={submit}>
    <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
    <button type="submit">Login</button></form>{err&&<p style={{color:'crimson'}}>{err}</p>}
    <p><a href="/register">Register</a></p></main>);
}

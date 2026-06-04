'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, ArrowRight, Play } from 'lucide-react'
import { USERS, DEMO_PASSWORD } from '@/lib/userStore'
import { useAppUser } from '@/contexts/UserContext'

// Separate real users from the demo account
const REAL_USERS = USERS.filter(u => u.id !== 'demo')
const DEMO_USER  = USERS.find(u => u.id === 'demo')!

export default function LoginPage() {
  const router = useRouter()
  const { switchUser } = useAppUser()
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [password, setPassword]         = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [loadingDemo, setLoadingDemo]   = useState(false)
  const [error, setError]               = useState('')
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedUser) {
      setError('Wybierz profil.')
      return
    }
    const user = REAL_USERS.find(u => u.id === selectedUser)
    const expectedPassword = user?.password ?? DEMO_PASSWORD
    if (password !== expectedPassword) {
      setError('Nieprawidłowe hasło.')
      return
    }

    setLoadingLogin(true)
    await new Promise(r => setTimeout(r, 600))
    switchUser(selectedUser)
    router.push('/demo')
  }

  const handleDemoLogin = async () => {
    setLoadingDemo(true)
    await new Promise(r => setTimeout(r, 500))
    switchUser('demo')
    router.push('/demo')
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#6366f1]/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/[0.05] blur-[100px]" />
      </div>

      {/* Topbar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold text-white tracking-tight">System H14</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] space-y-4">

          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-white tracking-tight mb-2">System H14</h1>
            <p className="text-[14px] text-white/45 leading-relaxed">
              Wybierz swój profil i wpisz hasło<br />aby wejść do systemu.
            </p>
          </div>

          {/* ── Demo account card ─────────────────────────────── */}
          <div className="bg-[#0d1f12] border border-[#22c55e]/25 rounded-[16px] p-5 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                style={{ background: DEMO_USER.color + '25', border: `2px solid ${DEMO_USER.color}`, color: DEMO_USER.color }}
              >
                {DEMO_USER.initials}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white leading-tight">Konto Demo</p>
                <p className="text-[11px] text-white/40 leading-tight">Wejdź z przykładowymi danymi — bez hasła</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] text-[10px] font-bold uppercase tracking-wide">Demo</span>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loadingDemo || loadingLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#22c55e]/90 hover:bg-[#22c55e] disabled:opacity-60 text-white text-[13px] font-semibold transition-all shadow-lg shadow-green-500/20"
            >
              {loadingDemo ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ładowanie...</>
              ) : (
                <><Play size={13} fill="white" /> Wejdź do Demo</>
              )}
            </button>
          </div>

          {/* ── Divider ───────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-white/25">lub zaloguj się na swoje konto</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* ── Real accounts card ────────────────────────────── */}
          <div className="bg-[#0F0F1A] border border-white/[0.08] rounded-[16px] p-6 shadow-2xl shadow-black/40">
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Profile selection */}
              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-2.5">Wybierz profil</label>
                <div className={`grid gap-3 ${REAL_USERS.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {REAL_USERS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setSelectedUser(u.id); setTimeout(() => passwordRef.current?.focus(), 0) }}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-[12px] border transition-all
                        ${selectedUser === u.id
                          ? 'bg-[#6366f1]/15 border-[#6366f1]/60 shadow-lg shadow-indigo-500/10'
                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15'}
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold"
                        style={{
                          background: u.color + '25',
                          border: `2px solid ${selectedUser === u.id ? u.color : u.color + '40'}`,
                          color: u.color,
                        }}
                      >
                        {u.initials}
                      </div>
                      <span className={`text-[13px] font-semibold transition-colors ${selectedUser === u.id ? 'text-white' : 'text-white/60'}`}>
                        {u.fullName}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                        style={{
                          background: u.role === 'sales' ? '#f59e0b20' : '#6366f120',
                          color: u.role === 'sales' ? '#f59e0b' : '#a5b4fc',
                        }}
                      >
                        {u.role === 'sales' ? 'Sales' : 'Admin'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-1.5">Hasło</label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className={`
                      w-full px-3.5 py-2.5 pr-10 rounded-[10px] bg-white/[0.04] border text-white
                      placeholder:text-white/25 text-[14px] focus:outline-none transition-all
                      ${error ? 'border-red-500/60 focus:border-red-500/80' : 'border-white/[0.08] focus:border-[#6366f1]/60 focus:bg-[#6366f1]/[0.04]'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && (
                  <p className="mt-1.5 text-[12px] text-red-400">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingLogin || loadingDemo}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] mt-1 bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-60 text-white text-[14px] font-semibold transition-all shadow-lg shadow-indigo-500/25"
              >
                {loadingLogin ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Logowanie...</>
                ) : (
                  <>Wejdź do platformy <ArrowRight size={15} /></>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>

      <div className="relative z-10 text-center py-4 border-t border-white/[0.04]">
        <p className="text-[11px] text-white/20">
          Przygotowane przez{' '}
          <a href="https://amautomations.pl" target="_blank" rel="noopener noreferrer" className="text-white/35 hover:text-white/60 transition-colors">AM Automations</a>
        </p>
      </div>
    </div>
  )
}

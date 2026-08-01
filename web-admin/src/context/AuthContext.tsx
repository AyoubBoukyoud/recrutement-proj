import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../lib/api'

type AuthUser = {
  id: number
  phone: string
  roles: string[]
}

type AuthContextValue = {
  user: AuthUser | null
  requestOtp: (phone: string) => Promise<{ debugCode: string | null }>
  verifyOtp: (phone: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('auth_user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })

  async function requestOtp(phone: string) {
    const { data } = await api.post('/auth/otp/request', { phone })
    return { debugCode: data.debug_otp_code as string | null }
  }

  async function verifyOtp(phone: string, code: string) {
    // Names the token in the candidate's/staff member's device list, so a
    // dashboard session is distinguishable from a phone.
    const { data } = await api.post('/auth/otp/verify', {
      phone,
      code,
      device_name: `Dashboard · ${navigator.platform || 'browser'}`,
    })
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

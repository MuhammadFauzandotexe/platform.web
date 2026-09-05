'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginAccount } from '../lib/auth'
import {
  AUTH_STATE_CHANGED_EVENT,
  clearStoredAuthState,
  getStoredAuthState,
  storeAuthState,
  updateStoredAccount,
  type AuthState,
} from '../lib/auth-store'
import type { Account } from '../lib/auth-store'

type AuthContextValue = {
  authState: AuthState | null
  isAuthLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthState>
  updateAccount: (account: Account) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    setAuthState(getStoredAuthState())
    setIsAuthLoading(false)
    const handleAuthStateChange = () => {
      console.debug('[AUT] Authentication state changed')
      setAuthState(getStoredAuthState())
    }
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChange)
    return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChange)
  }, [])

  useEffect(() => {
    if (!authState) return
    const timeout = window.setTimeout(() => {
      console.debug('[AUT] Token expired; clearing authentication state')
      clearStoredAuthState()
      setAuthState(null)
    }, Math.max(0, authState.expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [authState])

  const value = useMemo<AuthContextValue>(() => ({
    authState,
    isAuthLoading,
    isAuthenticated: Boolean(authState),
    async login(email, password) {
      const response = await loginAccount({ email, password })
      const nextState = storeAuthState(response)
      setAuthState(nextState)
      return nextState
    },
    updateAccount(account) {
      updateStoredAccount(account)
      setAuthState((currentState) => currentState ? { ...currentState, account } : currentState)
    },
    logout() {
      console.debug('[AUT] Logout called', new Error().stack)
      clearStoredAuthState()
      setAuthState(null)
    },
  }), [authState, isAuthLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

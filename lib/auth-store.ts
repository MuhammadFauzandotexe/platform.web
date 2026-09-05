export type Account = {
  id: string
  email: string
  accountStatus: string
  accountPlan: string
}

export type AuthState = {
  accessToken: string
  tokenType: string
  expiresIn: number
  expiresAt: number
  account: Account
}

const AUTH_STORAGE_KEY = 'luma.auth'
export const AUTH_STATE_CHANGED_EVENT = 'luma-auth-state-changed'
const authDebug = (...details: unknown[]) => console.debug('[AUT]', ...details)

const isBrowser = () => typeof window !== 'undefined'

export const getStoredAuthState = (): AuthState | null => {
  if (!isBrowser()) return null

  const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedValue) {
    authDebug('Token loaded: none')
    return null
  }

  try {
    const state = JSON.parse(storedValue) as AuthState
    if (!state.accessToken || !state.expiresAt || state.expiresAt <= Date.now()) {
      authDebug('Token removed: missing or expired persisted auth state')
      clearStoredAuthState()
      return null
    }
    authDebug('Token loaded', { expiresAt: state.expiresAt })
    return state
  } catch {
    authDebug('Token removed: persisted auth state was malformed')
    clearStoredAuthState()
    return null
  }
}

export const storeAuthState = (response: Omit<AuthState, 'expiresAt'>) => {
  const state: AuthState = {
    ...response,
    expiresAt: Date.now() + response.expiresIn * 1000,
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
  authDebug('Authentication state changed: token stored')
  return state
}

export const updateStoredAccount = (account: Account) => {
  if (!isBrowser()) return
  const currentState = getStoredAuthState()
  if (!currentState) return

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...currentState, account }))
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
  authDebug('Authentication state changed: account updated')
}

export const clearStoredAuthState = () => {
  if (isBrowser()) {
    authDebug('Token removed', new Error().stack)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
  }
}

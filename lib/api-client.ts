import { clearStoredAuthState, getStoredAuthState } from './auth-store'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown = null) {
    super('API request failed')
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const getApiBaseUrl = () => (
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8083').replace(/\/$/, '')
)

const parseResponseBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const request = async (path: string, options: RequestInit = {}, authenticated = false) => {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (authenticated) {
    const authState = getStoredAuthState()
    if (!authState) throw new ApiError(401)
    headers.set('Authorization', `${authState.tokenType} ${authState.accessToken}`)
  }

  const requestUrl = `${getApiBaseUrl()}${path}`
  console.debug('[API] Request URL', requestUrl, { authenticationHeaderPresent: authenticated })
  const response = await fetch(requestUrl, { ...options, headers })
  const body = await parseResponseBody(response)
  console.debug('[API] Response status', response.status, { requestUrl, authenticated })

  if (response.status === 401 && authenticated) {
    console.warn('[API] Unauthorized handler triggered', { requestUrl })
    clearStoredAuthState()
    if (typeof window !== 'undefined') {
      window.location.assign('/')
    }
  }

  if (!response.ok) throw new ApiError(response.status, body)
  return body
}

export const api = {
  publicRequest: (path: string, options?: RequestInit) => request(path, options, false),
  authenticatedRequest: (path: string, options?: RequestInit) => request(path, options, true),
}

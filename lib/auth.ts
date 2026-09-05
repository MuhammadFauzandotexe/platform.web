import { api, ApiError } from './api-client'
import type { Account, AuthState } from './auth-store'

export type RegisterPayload = {
  email: string
  password: string
}

export type RegistrationResponse = {
  accountStatus?: string
  accountPlan?: string
  message?: string
}

export type LoginPayload = RegisterPayload

export type LoginResponse = Omit<AuthState, 'expiresAt'>

export class AuthApiError extends Error {
  status: number
  code: 'invalid-credentials' | 'duplicate-email' | 'unknown'

  constructor(status: number, code: AuthApiError['code']) {
    super('Authentication request failed')
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

const toAuthError = (error: unknown, duplicateEmail = false): AuthApiError => {
  if (error instanceof ApiError) {
    return new AuthApiError(
      error.status,
      duplicateEmail ? 'duplicate-email' : error.status === 401 ? 'invalid-credentials' : 'unknown',
    )
  }
  return new AuthApiError(0, 'unknown')
}

export async function registerAccount(payload: RegisterPayload): Promise<RegistrationResponse> {
  try {
    return await api.publicRequest('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }) as RegistrationResponse
  } catch (error) {
    const isDuplicateEmail = error instanceof ApiError && (
      error.status === 409
      || (typeof error.body === 'object' && error.body !== null
        && 'error' in error.body && error.body.error === 'Duplicate email')
    )
    throw toAuthError(error, isDuplicateEmail)
  }
}

export async function loginAccount(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await api.publicRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }) as Partial<LoginResponse>

    if (
      typeof response.accessToken !== 'string'
      || typeof response.tokenType !== 'string'
      || typeof response.expiresIn !== 'number'
      || !response.account
    ) {
      throw new AuthApiError(0, 'unknown')
    }

    return response as LoginResponse
  } catch (error) {
    if (error instanceof AuthApiError) throw error
    throw toAuthError(error)
  }
}

export type { Account }

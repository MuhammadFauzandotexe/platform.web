import { api } from './api-client'
import type { Account } from './auth-store'

export type CurrentAccount = Account & {
  createdAt?: string
  updatedAt?: string
}

export async function getCurrentAccount(): Promise<CurrentAccount> {
  return await api.authenticatedRequest('/api/accounts/me') as CurrentAccount
}

import { api } from './api-client'

export type WhatsAppSession = {
  id: string
  sessionId: string
  sessionName: string
  status: string
  qrCode: string | null
  qrExpiresAt: string | null
  expiresAt: string | null
  phoneNumber: string | null
  connectedAt: string | null
  disconnectedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SessionSyncResponse = {
  sessionName: string
  sessionId: string
  status: string
  connected: boolean
}

export async function createWhatsAppSession(sessionName: string): Promise<WhatsAppSession> {
  const response = await api.authenticatedRequest('/api/whatsapp/sessions', {
    method: 'POST',
    body: JSON.stringify({ sessionName }),
  })
  return response as WhatsAppSession
}

export async function syncWhatsAppSession(sessionName: string): Promise<SessionSyncResponse> {
  const response = await api.authenticatedRequest('/api/whatsapp/sessions/sync', {
    method: 'POST',
    body: JSON.stringify({ sessionName }),
  })
  return response as SessionSyncResponse
}

export async function getWhatsAppSessions(): Promise<WhatsAppSession[]> {
  const response = await api.authenticatedRequest('/api/whatsapp/sessions')
  if (!Array.isArray(response)) throw new Error('Unexpected sessions response')
  return response as WhatsAppSession[]
}

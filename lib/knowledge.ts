import { api } from './api-client'

export interface KnowledgeItem {
  pointId: string
  documentId: string
  chunkId: string
  content: string
  chunkIndex: number
  createdAt: string
}

export interface KnowledgeListResponse {
  items: KnowledgeItem[]
  nextCursor: string | null
}

export interface KnowledgeIngestionRequest {
  documentId: string
  content: string
}

export interface KnowledgeChunkResult {
  pointId: string
  chunkId: string
  chunkIndex: number
  success: boolean
}

export interface KnowledgeIngestionResponse {
  tenantId: string
  documentId: string
  totalChunks: number
  successfulChunks: number
  status: string
  chunks: KnowledgeChunkResult[]
}

export interface KnowledgeQueryRequest {
  question: string
}

export interface KnowledgeQueryResult {
  pointId: string
  documentId: string
  chunkId: string
  content: string
  chunkIndex: number
  score: number
}

export interface KnowledgeQueryResponse {
  question: string
  totalResults: number
  results: KnowledgeQueryResult[]
}

const isKnowledgeItem = (value: unknown): value is KnowledgeItem => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.pointId === 'string'
    && typeof item.documentId === 'string'
    && typeof item.chunkId === 'string'
    && typeof item.content === 'string'
    && typeof item.chunkIndex === 'number'
    && typeof item.createdAt === 'string'
}

export async function getKnowledge(cursor?: string | null): Promise<KnowledgeListResponse> {
  const params = new URLSearchParams({ limit: '20' })
  if (cursor) params.set('cursor', cursor)

  const response = await api.authenticatedRequest(`/api/knowledge?${params.toString()}`)
  if (!response || typeof response !== 'object') throw new Error('Unexpected knowledge response')

  const body = response as { items?: unknown; nextCursor?: unknown }
  if (!Array.isArray(body.items) || !body.items.every(isKnowledgeItem)) {
    throw new Error('Unexpected knowledge response')
  }

  return {
    items: body.items,
    nextCursor: typeof body.nextCursor === 'string' ? body.nextCursor : null,
  }
}

export async function deleteKnowledge(pointId: string): Promise<void> {
  await api.authenticatedRequest(`/api/knowledge/${encodeURIComponent(pointId)}`, { method: 'DELETE' })
}

export async function ingestKnowledge(content: string): Promise<KnowledgeIngestionResponse> {
  const trimmedContent = content.trim()
  const request: KnowledgeIngestionRequest = {
    documentId: crypto.randomUUID(),
    content: trimmedContent,
  }

  const response = await api.authenticatedRequest('/api/knowledge/ingest', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!response || typeof response !== 'object') throw new Error('Unexpected knowledge ingestion response')
  const body = response as Record<string, unknown>
  if (
    typeof body.tenantId !== 'string'
    || typeof body.documentId !== 'string'
    || typeof body.totalChunks !== 'number'
    || typeof body.successfulChunks !== 'number'
    || typeof body.status !== 'string'
    || !Array.isArray(body.chunks)
  ) {
    throw new Error('Unexpected knowledge ingestion response')
  }

  const chunks = body.chunks as unknown[]
  if (!chunks.every((chunk) => {
    if (!chunk || typeof chunk !== 'object') return false
    const item = chunk as Record<string, unknown>
    return typeof item.pointId === 'string'
      && typeof item.chunkId === 'string'
      && typeof item.chunkIndex === 'number'
      && typeof item.success === 'boolean'
  })) {
    throw new Error('Unexpected knowledge ingestion response')
  }

  return {
    tenantId: body.tenantId,
    documentId: body.documentId,
    totalChunks: body.totalChunks,
    successfulChunks: body.successfulChunks,
    status: body.status,
    chunks: chunks as KnowledgeChunkResult[],
  }
}

export async function queryKnowledge(question: string): Promise<KnowledgeQueryResponse> {
  const request: KnowledgeQueryRequest = { question: question.trim() }
  const response = await api.authenticatedRequest('/api/knowledge/query', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!response || typeof response !== 'object') throw new Error('Unexpected knowledge query response')
  const body = response as Record<string, unknown>
  if (typeof body.question !== 'string' || typeof body.totalResults !== 'number' || !Array.isArray(body.results)) {
    throw new Error('Unexpected knowledge query response')
  }

  const results = body.results as unknown[]
  if (!results.every((result) => {
    if (!result || typeof result !== 'object') return false
    const item = result as Record<string, unknown>
    return typeof item.pointId === 'string'
      && typeof item.documentId === 'string'
      && typeof item.chunkId === 'string'
      && typeof item.content === 'string'
      && typeof item.chunkIndex === 'number'
      && typeof item.score === 'number'
  })) {
    throw new Error('Unexpected knowledge query response')
  }

  return {
    question: body.question,
    totalResults: body.totalResults,
    results: (results as KnowledgeQueryResult[]).sort((a, b) => b.score - a.score),
  }
}

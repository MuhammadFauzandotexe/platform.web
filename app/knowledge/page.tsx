'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  Eye,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { DashboardNav } from '../../components/dashboard-nav'
import { useAuth } from '../../components/auth-provider'
import { ApiError } from '../../lib/api-client'
import { deleteKnowledge, getKnowledge, ingestKnowledge, type KnowledgeItem } from '../../lib/knowledge'

type LoadState = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function KnowledgePage() {
  const router = useRouter()
  const { authState, isAuthLoading, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [currentCursor, setCurrentCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [isPaginating, setIsPaginating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [viewItem, setViewItem] = useState<KnowledgeItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<KnowledgeItem | null>(null)
  const [deletingPointId, setDeletingPointId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [content, setContent] = useState('')
  const [addError, setAddError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const requestId = useRef(0)

  const loadKnowledgePage = useCallback(async (cursor: string | null, page: number, history: (string | null)[], reset = false) => {
    const currentRequestId = ++requestId.current
    if (!reset) setIsPaginating(true)
    setErrorMessage('')
    try {
      const response = await getKnowledge(cursor)
      if (currentRequestId !== requestId.current) return
      setItems(response.items)
      setCurrentCursor(cursor)
      setNextCursor(response.nextCursor)
      setCursorHistory(history)
      setPageNumber(page)
      setLoadState('success')
    } catch (error) {
      if (currentRequestId !== requestId.current) return
      if (error instanceof ApiError && error.status === 401) return
      if (reset) setLoadState('error')
      else setNotice({ kind: 'error', message: 'Unable to load this knowledge page. Please try again.' })
      setErrorMessage('We couldn’t retrieve your knowledge right now. Please try again.')
    } finally {
      if (currentRequestId === requestId.current) setIsPaginating(false)
    }
  }, [])

  const loadKnowledge = useCallback(async (refresh = false) => {
    setLoadState(refresh ? 'refreshing' : 'loading')
    setNotice(null)
    if (refresh) {
      setCurrentCursor(null)
      setCursorHistory([])
      setPageNumber(1)
    }
    await loadKnowledgePage(refresh ? null : currentCursor, refresh ? 1 : pageNumber, refresh ? [] : cursorHistory, true)
  }, [currentCursor, cursorHistory, loadKnowledgePage, pageNumber])

  const goToNextPage = useCallback(async () => {
    if (!nextCursor || isPaginating || loadState !== 'success') return
    setNotice(null)
    await loadKnowledgePage(nextCursor, pageNumber + 1, [...cursorHistory, currentCursor])
  }, [currentCursor, cursorHistory, isPaginating, loadKnowledgePage, loadState, nextCursor, pageNumber])

  const goToPreviousPage = useCallback(async () => {
    if (cursorHistory.length === 0 || isPaginating || loadState !== 'success') return
    setNotice(null)
    const previousCursor = cursorHistory[cursorHistory.length - 1]
    await loadKnowledgePage(previousCursor, pageNumber - 1, cursorHistory.slice(0, -1))
  }, [cursorHistory, isPaginating, loadKnowledgePage, loadState, pageNumber])

  useEffect(() => {
    if (!isAuthLoading && !authState) router.replace('/login')
  }, [authState, isAuthLoading, router])

  useEffect(() => {
    if (authState) {
      setLoadState('loading')
      void loadKnowledgePage(null, 1, [], true)
    }
  }, [authState, loadKnowledgePage])

  const initials = useMemo(() => authState?.account.email.charAt(0).toUpperCase() || '?', [authState?.account.email])
  const isLoading = loadState === 'loading'
  const isRefreshing = loadState === 'refreshing'

  const confirmDelete = async () => {
    if (!deleteItem || deletingPointId) return
    const pointId = deleteItem.pointId
    setDeletingPointId(pointId)
    setNotice(null)
    try {
      await deleteKnowledge(pointId)
      setDeleteItem(null)
      const response = await getKnowledge(currentCursor)
      if (response.items.length === 0 && pageNumber > 1 && cursorHistory.length > 0) {
        const previousCursor = cursorHistory[cursorHistory.length - 1]
        await loadKnowledgePage(previousCursor, pageNumber - 1, cursorHistory.slice(0, -1), true)
      } else {
        setItems(response.items)
        setNextCursor(response.nextCursor)
      }
      setNotice({ kind: 'success', message: 'Knowledge deleted successfully' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return
      setNotice({ kind: 'error', message: 'Unable to delete this knowledge. Please try again.' })
    } finally {
      setDeletingPointId(null)
    }
  }

  const closeAddModal = () => {
    if (isAdding) return
    setAddModalOpen(false)
    setContent('')
    setAddError('')
  }

  const resetAddModal = () => {
    setAddModalOpen(false)
    setContent('')
    setAddError('')
  }

  const submitKnowledge = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      setAddError('Content is required.')
      return
    }

    setIsAdding(true)
    setAddError('')
    try {
      const response = await ingestKnowledge(trimmedContent)
      if (response.status.toUpperCase() !== 'SUCCESS') {
        throw new Error('Knowledge ingestion was not successful')
      }
      resetAddModal()
      await loadKnowledge(true)
      setNotice({
        kind: 'success',
        message: response.totalChunks > 1
          ? `Knowledge added successfully. ${response.totalChunks} chunks were created.`
          : 'Knowledge added successfully.',
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return
      setAddError(error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body && typeof error.body.message === 'string'
        ? error.body.message
        : 'Failed to add knowledge. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  if (isAuthLoading || !authState) {
    return <main className="auth-shell" aria-busy="true"><section className="success-card"><LoaderCircle className="spin" size={25} aria-label="Loading" /></section></main>
  }

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <DashboardNav onClose={() => setMobileNavOpen(false)} />
      </aside>
      {mobileNavOpen && <button className="nav-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className="portal-main">
        <header className="portal-header">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="workspace-context">Workspace <span className="context-muted">/ AI Knowledge</span></div>
          <div className="account-wrap">
            <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
              <span className="avatar">{initials}</span><span className="account-name">{authState.account.email}</span><ChevronDown size={15} />
            </button>
            {accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">{initials}</span><div><strong>{authState.account.email}</strong><span><span className="status-dot" /> Signed in</span><small>Plan: {authState.account.accountPlan} · Status: {authState.account.accountStatus}</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => { logout(); router.replace('/') }} role="menuitem"><LogOut size={16} /> Log out</button></div>}
          </div>
        </header>

        <main className="knowledge-content">
          <div className="sessions-heading">
            <div><div className="eyebrow">AI</div><h1>AI Knowledge</h1><p>Manage the knowledge used by your AI to provide better answers.</p></div>
            <div className="sessions-actions">
              <button className="secondary-button" onClick={() => void loadKnowledge(true)} disabled={isLoading || isRefreshing}><RefreshCw className={isRefreshing ? 'spin' : ''} size={15} /> Refresh</button>
              <button className="secondary-button" onClick={() => router.push('/knowledge/test')} disabled={isLoading || isRefreshing}><Brain size={15} /> Test Knowledge</button>
              <button className="primary-button" onClick={() => { setAddModalOpen(true); setAddError('') }} disabled={isLoading || isRefreshing}><Plus size={16} /> Add Knowledge</button>
            </div>
          </div>

          {notice && <div className={`form-alert knowledge-notice ${notice.kind === 'success' ? 'success-notice' : ''}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.kind === 'success' ? <Check size={17} /> : <AlertCircle size={17} />}<span>{notice.message}</span><button className="icon-button" onClick={() => setNotice(null)} aria-label="Dismiss message"><X size={16} /></button></div>}

          {isLoading && <KnowledgeTableSkeleton />}
          {loadState === 'error' && <section className="sessions-card sessions-error" role="alert"><AlertCircle size={22} /><h2>Unable to load knowledge</h2><p>{errorMessage}</p><button className="primary-button" onClick={() => void loadKnowledge()}><RefreshCw size={15} /> Try Again</button></section>}
          {loadState === 'success' && items.length === 0 && <section className="sessions-card sessions-empty"><div className="empty-icon"><Brain size={24} /></div><h2>No knowledge yet</h2><p>Add knowledge to help your AI provide more accurate and relevant answers.</p><button className="primary-button" onClick={() => { setAddModalOpen(true); setAddError('') }}><Plus size={16} /> Add Knowledge</button></section>}
          {loadState === 'success' && items.length > 0 && <KnowledgeTable items={items} onView={setViewItem} onDelete={setDeleteItem} isDeleting={Boolean(deletingPointId)} isLoading={isPaginating} />}
          {loadState === 'success' && items.length > 0 && <div className="knowledge-pagination" aria-label="Knowledge pagination"><button className="secondary-button" onClick={() => void goToPreviousPage()} disabled={cursorHistory.length === 0 || isPaginating}><ArrowLeft size={15} /> Previous</button><span>Page {pageNumber}</span><button className="secondary-button" onClick={() => void goToNextPage()} disabled={!nextCursor || isPaginating}>Next <ArrowRight size={15} /></button></div>}
        </main>
      </div>

      {viewItem && <KnowledgeViewDialog item={viewItem} onClose={() => setViewItem(null)} />}
      {deleteItem && <div className="dialog-backdrop" role="presentation"><section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-knowledge-title"><div className="dialog-icon danger-dialog-icon"><Trash2 size={19} /></div><h2 id="delete-knowledge-title">Delete Knowledge?</h2><p>Are you sure you want to delete this knowledge? This action cannot be undone.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setDeleteItem(null)} disabled={Boolean(deletingPointId)}>Cancel</button><button className="danger-button" onClick={() => void confirmDelete()} disabled={Boolean(deletingPointId)}>{deletingPointId ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />} {deletingPointId ? 'Deleting...' : 'Delete Knowledge'}</button></div></section></div>}
      {addModalOpen && <AddKnowledgeDialog content={content} error={addError} isAdding={isAdding} onChange={(value) => { setContent(value); if (addError) setAddError('') }} onClose={closeAddModal} onSubmit={() => void submitKnowledge()} />}
    </div>
  )
}

function KnowledgeTableSkeleton() {
  return <section className="sessions-card"><div className="session-table-wrap"><table className="session-table knowledge-table"><thead><tr><th>Content</th><th>Document ID</th><th>Created At</th><th>Action</th></tr></thead><tbody>{Array.from({ length: 5 }, (_, index) => <tr className="skeleton-row" key={index}><td /><td /><td /><td /></tr>)}</tbody></table></div></section>
}

function KnowledgeTable({ items, onView, onDelete, isDeleting, isLoading }: { items: KnowledgeItem[]; onView: (item: KnowledgeItem) => void; onDelete: (item: KnowledgeItem) => void; isDeleting: boolean; isLoading: boolean }) {
  return <section className={`sessions-card ${isLoading ? 'knowledge-table-card-loading' : ''}`} aria-busy={isLoading}><div className="session-table-wrap"><table className="session-table knowledge-table"><thead><tr><th>Content</th><th>Document ID</th><th>Created At</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item.pointId}><td><button className="knowledge-content-button" onClick={() => onView(item)} title="View knowledge content"><span>{item.content}</span><small>View full content</small></button></td><td><code className="knowledge-id">{item.documentId}</code></td><td>{formatDate(item.createdAt)}</td><td><div className="knowledge-actions"><button className="table-action" onClick={() => onView(item)} aria-label="View knowledge"><Eye size={15} /> View</button><button className="table-action destructive-action" onClick={() => onDelete(item)} disabled={isDeleting || isLoading} aria-label="Delete knowledge"><Trash2 size={15} /> Delete</button></div></td></tr>)}</tbody></table></div>{isLoading && <div className="knowledge-table-loading-overlay"><LoaderCircle className="spin" size={22} /> Loading page...</div>}</section>
}

function KnowledgeViewDialog({ item, onClose }: { item: KnowledgeItem; onClose: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><section className="logout-dialog knowledge-dialog" role="dialog" aria-modal="true" aria-labelledby="view-knowledge-title"><button className="prompt-close icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="dialog-icon"><Eye size={19} /></div><h2 id="view-knowledge-title">Knowledge Details</h2><div className="knowledge-detail-content">{item.content}</div><dl className="knowledge-details"><div><dt>Document ID</dt><dd>{item.documentId}</dd></div><div><dt>Chunk ID</dt><dd>{item.chunkId}</dd></div><div><dt>Chunk Index</dt><dd>{item.chunkIndex}</dd></div><div><dt>Created At</dt><dd>{formatDate(item.createdAt)}</dd></div></dl><div className="dialog-actions"><button className="primary-button" onClick={onClose}>Close</button></div></section></div>
}

function AddKnowledgeDialog({ content, error, isAdding, onChange, onClose, onSubmit }: { content: string; error: string; isAdding: boolean; onChange: (value: string) => void; onClose: () => void; onSubmit: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><section className="logout-dialog knowledge-dialog add-knowledge-dialog" role="dialog" aria-modal="true" aria-labelledby="add-knowledge-title"><button className="prompt-close icon-button" onClick={onClose} disabled={isAdding} aria-label="Close"><X size={18} /></button><div className="dialog-icon"><Plus size={19} /></div><h2 id="add-knowledge-title">Add AI Knowledge</h2><p>Add information that your AI can use to provide more accurate and relevant answers.</p><label className="knowledge-form-label" htmlFor="knowledge-content">Content</label><textarea id="knowledge-content" className="knowledge-textarea" value={content} onChange={(event) => onChange(event.target.value)} placeholder="Enter information, FAQ, product details, policies, or any knowledge you want your AI to use..." disabled={isAdding} autoFocus /><div className="knowledge-form-meta"><span className={error ? 'knowledge-form-error' : ''}>{error || 'Content is required.'}</span><span>{content.length} characters</span></div><div className="dialog-actions"><button className="secondary-button" onClick={onClose} disabled={isAdding}>Cancel</button><button className="primary-button" onClick={onSubmit} disabled={isAdding || !content.trim()}>{isAdding && <LoaderCircle className="spin" size={15} />}{isAdding ? 'Adding Knowledge...' : 'Add Knowledge'}</button></div></section></div>
}

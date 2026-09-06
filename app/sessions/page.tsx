'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react'
import { DashboardNav } from '../../components/dashboard-nav'
import { useAuth } from '../../components/auth-provider'
import { ApiError } from '../../lib/api-client'
import { getWhatsAppSessions, type WhatsAppSession } from '../../lib/whatsapp'

type LoadState = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'

const formatDate = (value: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const statusLabel = (status: string) => {
  const normalizedStatus = status.toUpperCase()
  if (normalizedStatus === 'CONNECTED') return 'Connected'
  if (normalizedStatus === 'DISCONNECTED') return 'Disconnected'
  if (normalizedStatus === 'QR_READY') return 'Waiting for QR scan'
  return status.replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, (character) => character.toUpperCase()) || 'Unknown'
}

const statusClass = (status: string) => {
  const normalizedStatus = status.toUpperCase()
  if (normalizedStatus === 'CONNECTED') return 'connected'
  if (normalizedStatus === 'DISCONNECTED') return 'disconnected'
  if (normalizedStatus === 'QR_READY') return 'waiting'
  return 'unknown'
}

export default function SessionsPage() {
  const router = useRouter()
  const { authState, isAuthLoading, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [actionSessionId, setActionSessionId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [emptyPromptOpen, setEmptyPromptOpen] = useState(false)
  const [emptyPromptDismissed, setEmptyPromptDismissed] = useState(false)
  const requestId = useRef(0)

  const loadSessions = useCallback(async (isRefresh = false) => {
    const currentRequestId = ++requestId.current
    setLoadState(isRefresh ? 'refreshing' : 'loading')
    setErrorMessage('')
    try {
      const nextSessions = await getWhatsAppSessions()
      if (currentRequestId !== requestId.current) return
      setSessions(nextSessions)
      setLoadState('success')
    } catch (error) {
      if (currentRequestId !== requestId.current) return
      if (error instanceof ApiError && error.status === 401) return
      setLoadState('error')
      setErrorMessage('Unable to load WhatsApp sessions.')
    }
  }, [])

  useEffect(() => {
    if (!isAuthLoading && !authState) router.replace('/login')
  }, [authState, isAuthLoading, router])

  useEffect(() => {
    if (!authState) return
    void loadSessions()
  }, [authState, loadSessions])

  useEffect(() => {
    if (loadState !== 'success' || sessions.length > 0 || emptyPromptDismissed) return
    const timeout = window.setTimeout(() => setEmptyPromptOpen(true), 10000)
    return () => window.clearTimeout(timeout)
  }, [emptyPromptDismissed, loadState, sessions.length])

  const initials = useMemo(() => authState?.account.email.charAt(0).toUpperCase() || '?', [authState?.account.email])
  const isLoading = loadState === 'loading'
  const isRefreshing = loadState === 'refreshing'

  const handlePlaceholderAction = (label: string) => {
    setActionSessionId(null)
    setActionMessage(`${label} will be available soon.`)
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
          <div className="workspace-context">Workspace <span className="context-muted">/ WhatsApp sessions</span></div>
          <div className="account-wrap">
            <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
              <span className="avatar">{initials}</span><span className="account-name">{authState.account.email}</span><ChevronDown size={15} />
            </button>
            {accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">{initials}</span><div><strong>{authState.account.email}</strong><span><span className="status-dot" /> Signed in</span><small>Plan: {authState.account.accountPlan} · Status: {authState.account.accountStatus}</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => { logout(); router.replace('/') }} role="menuitem"><LogOut size={16} /> Log out</button></div>}
          </div>
        </header>

        <main className="sessions-content">
          <div className="sessions-heading">
            <div><div className="eyebrow">Connections</div><h1>WhatsApp Sessions</h1><p>Manage and monitor your connected WhatsApp sessions.</p></div>
            <div className="sessions-actions">
              <button className="secondary-button" onClick={() => void loadSessions(true)} disabled={isLoading || isRefreshing}><RefreshCw className={isRefreshing ? 'spin' : ''} size={15} /> Refresh</button>
              <button className="primary-button" onClick={() => router.push('/sessions/create')}><Plus size={16} /> Add New Session</button>
            </div>
          </div>

          {actionMessage && <div className="form-alert sessions-notice" role="status"><Check size={17} /><span>{actionMessage}</span><button className="icon-button" onClick={() => setActionMessage('')} aria-label="Dismiss message"><X size={16} /></button></div>}

          {isLoading && <section className="sessions-card"><div className="session-table-wrap"><table className="session-table"><thead><tr><th>Session Name</th><th>Status</th><th>Phone Number</th><th>Connected At</th><th>Created At</th><th>Actions</th></tr></thead><tbody>{Array.from({ length: 4 }, (_, index) => <tr className="skeleton-row" key={index}><td /><td /><td /><td /><td /><td /></tr>)}</tbody></table></div></section>}

          {loadState === 'error' && <section className="sessions-card sessions-error" role="alert"><AlertCircle size={22} /><h2>Unable to load WhatsApp sessions</h2><p>{errorMessage}</p><button className="primary-button" onClick={() => void loadSessions()}><RefreshCw size={15} /> Try Again</button></section>}

          {loadState === 'success' && sessions.length === 0 && <section className="sessions-card sessions-empty"><div className="empty-icon"><MessageCircle size={24} /></div><h2>No WhatsApp sessions yet</h2><p>Create your first WhatsApp session to start connecting your account.</p><button className="primary-button" onClick={() => router.push('/sessions/create')}><Plus size={16} /> Add New Session</button></section>}

          {loadState === 'success' && sessions.length > 0 && <section className="sessions-card"><div className="session-table-wrap"><table className="session-table"><thead><tr><th>Session Name</th><th>Status</th><th>Phone Number</th><th>Connected At</th><th>Created At</th><th>Actions</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td><strong>{session.sessionName || '-'}</strong><span className="session-id">{session.sessionId}</span></td><td><span className={`session-status ${statusClass(session.status)}`}><span /> {statusLabel(session.status)}</span></td><td>{session.phoneNumber || '-'}</td><td>{formatDate(session.connectedAt)}</td><td>{formatDate(session.createdAt)}</td><td><div className="session-action-wrap"><button className="session-action-trigger" onClick={() => setActionSessionId((current) => current === session.id ? null : session.id)} aria-label={`Actions for ${session.sessionName}`} aria-expanded={actionSessionId === session.id}><MoreIcon /></button>{actionSessionId === session.id && <div className="session-action-menu"><button onClick={() => handlePlaceholderAction('Viewing session details')}><Eye size={14} /> View Session <ChevronRight size={13} /></button><button onClick={() => handlePlaceholderAction('Terminating a session')}><LogOut size={14} /> Terminate Session <ChevronRight size={13} /></button><button onClick={() => handlePlaceholderAction('Deleting a session')}><X size={14} /> Delete Session <ChevronRight size={13} /></button></div>}</div></td></tr>)}</tbody></table></div></section>}
        </main>
      </div>

      {emptyPromptOpen && <div className="dialog-backdrop" role="presentation"><section className="logout-dialog sessions-prompt" role="dialog" aria-modal="true" aria-labelledby="empty-prompt-title"><button className="prompt-close icon-button" onClick={() => { setEmptyPromptOpen(false); setEmptyPromptDismissed(true) }} aria-label="Dismiss"><X size={18} /></button><div className="dialog-icon"><MessageCircle size={19} /></div><h2 id="empty-prompt-title">Connect your first WhatsApp session</h2><p>You don&apos;t have any active WhatsApp sessions yet. Create a new session to connect your WhatsApp account.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => { setEmptyPromptOpen(false); setEmptyPromptDismissed(true) }}>Not Now</button><button className="primary-button" onClick={() => { setEmptyPromptOpen(false); setEmptyPromptDismissed(true); router.push('/sessions/create') }}><Plus size={15} /> Add New Session</button></div></section></div>}
    </div>
  )
}

function MoreIcon() {
  return <span className="more-icon" aria-hidden="true"><i /><i /><i /></span>
}

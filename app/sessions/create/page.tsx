'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCw,
  X,
} from 'lucide-react'
import { DashboardNav } from '../../../components/dashboard-nav'
import { useAuth } from '../../../components/auth-provider'
import { ApiError } from '../../../lib/api-client'
import {
  createWhatsAppSession,
  syncWhatsAppSession,
  type SessionSyncResponse,
  type WhatsAppSession,
} from '../../../lib/whatsapp'

type PageState = 'initial' | 'creating' | 'qr' | 'connected' | 'error'
type ErrorKind = 'already-exists' | 'not-found' | 'generic'

const MAX_ATTEMPTS = 3
const SYNC_INTERVAL_MS = 10000
const MANUAL_SYNC_COOLDOWN_SECONDS = 5

const getErrorCode = (error: unknown) => {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return ''
  const body = error.body as { error?: unknown }
  return typeof body.error === 'string' ? body.error : ''
}

const formatRemaining = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export default function CreateSessionPage() {
  const router = useRouter()
  const { authState, isAuthLoading, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [session, setSession] = useState<WhatsAppSession | null>(null)
  const [pageState, setPageState] = useState<PageState>('initial')
  const [attemptCount, setAttemptCount] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCooldownRemaining, setSyncCooldownRemaining] = useState(0)
  const [errorKind, setErrorKind] = useState<ErrorKind>('generic')
  const [errorMessage, setErrorMessage] = useState('')
  const syncInFlight = useRef(false)
  const mounted = useRef(true)
  const connectionStopped = useRef(false)
  const syncRequestId = useRef(0)

  useEffect(() => {
    if (!isAuthLoading && !authState) router.replace('/login')
  }, [authState, isAuthLoading, router])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const stopConnectionTimers = useCallback(() => {
    setRemainingSeconds(0)
  }, [])

  const showError = useCallback((kind: ErrorKind, message: string) => {
    setErrorKind(kind)
    setErrorMessage(message)
    setPageState('error')
    stopConnectionTimers()
  }, [stopConnectionTimers])

  const applyConnectionResult = useCallback((result: WhatsAppSession | SessionSyncResponse) => {
    const connected = result.status === 'CONNECTED' || ('connected' in result && result.connected)
    if (connected) {
      console.debug('[WA_SESSION] Stopping polling and QR countdown')
      console.debug('[WA_SESSION] Session connected', {
        sessionName,
        previousStatus: session?.status,
        newStatus: result.status,
      })
      connectionStopped.current = true
      setSession((currentSession) => currentSession
        ? { ...currentSession, status: 'CONNECTED', connectedAt: new Date().toISOString() }
        : currentSession)
      setPageState('connected')
      stopConnectionTimers()
    }
  }, [session?.status, sessionName, stopConnectionTimers])

  const handleCreate = useCallback(async (name: string, attempt: number) => {
    setPageState('creating')
    setErrorMessage('')
    try {
      const createdSession = await createWhatsAppSession(name)
      if (!mounted.current) return
      connectionStopped.current = false
      console.debug('[WA_SESSION] Create response received', { status: createdSession.status, attempt })
      setSession(createdSession)
      setAttemptCount(attempt)
      setRemainingSeconds(createdSession.qrExpiresAt
        ? Math.max(0, Math.ceil((new Date(createdSession.qrExpiresAt).getTime() - Date.now()) / 1000))
        : 0)
      if (createdSession.status === 'CONNECTED') {
        applyConnectionResult(createdSession)
      } else if (createdSession.status === 'QR_READY' && createdSession.qrCode) {
        setPageState('qr')
      } else {
        showError('generic', 'Something went wrong while connecting your WhatsApp session.')
      }
    } catch (error) {
      if (!mounted.current) return
      const code = getErrorCode(error)
      if (code === 'SESSION_ALREADY_EXISTS') {
        showError('already-exists', 'A WhatsApp session with this name already exists.')
      } else {
        showError('generic', 'Something went wrong while connecting your WhatsApp session.')
      }
    }
  }, [applyConnectionResult, showError])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedName = sessionName.trim()
    if (!normalizedName || pageState === 'creating') {
      if (!normalizedName) setErrorMessage('Session name is required.')
      return
    }
    setSessionName(normalizedName)
    setAttemptCount(1)
    await handleCreate(normalizedName, 1)
  }

  const syncConnection = useCallback(async () => {
    if (!sessionName.trim() || syncInFlight.current || connectionStopped.current || pageState !== 'qr') return
    const currentRequestId = ++syncRequestId.current
    console.debug('[WA_SESSION] Sync started', { requestId: currentRequestId, sessionName })
    syncInFlight.current = true
    setIsSyncing(true)
    try {
      const result = await syncWhatsAppSession(sessionName.trim())
      if (!mounted.current) return
      console.debug('[WA_SESSION] Sync response received', {
        requestId: currentRequestId,
        previousStatus: session?.status,
        newStatus: result.status,
        connected: result.connected,
      })
      if (connectionStopped.current || currentRequestId !== syncRequestId.current) return
      if (result.status === 'CONNECTED' || result.connected) {
        applyConnectionResult(result)
      }
    } catch (error) {
      if (!mounted.current) return
      if (getErrorCode(error) === 'SESSION_NOT_FOUND') {
        showError('not-found', 'WhatsApp session could not be found.')
      } else if (!(error instanceof ApiError && error.status === 401)) {
        showError('generic', 'Something went wrong while connecting your WhatsApp session.')
      }
      console.debug('[WA_SESSION] Sync failed', { requestId: currentRequestId, status: error instanceof ApiError ? error.status : 'unknown' })
    } finally {
      syncInFlight.current = false
      if (mounted.current) setIsSyncing(false)
    }
  }, [applyConnectionResult, pageState, session?.status, sessionName, showError])

  useEffect(() => {
    if (pageState !== 'qr' || !session?.qrExpiresAt) return
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((new Date(session.qrExpiresAt as string).getTime() - Date.now()) / 1000))
      setRemainingSeconds(remaining)
    }
    updateRemaining()
    const timer = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timer)
  }, [pageState, session?.qrExpiresAt])

  const refreshQr = useCallback(async () => {
    if (!sessionName.trim()) return
    if (attemptCount >= MAX_ATTEMPTS) {
      showError('generic', "We couldn't establish the WhatsApp connection after several attempts.")
      return
    }
    await handleCreate(sessionName.trim(), attemptCount + 1)
  }, [attemptCount, handleCreate, sessionName, showError])

  useEffect(() => {
    if (pageState !== 'qr') return
    if (remainingSeconds === 0 && session?.qrExpiresAt && new Date(session.qrExpiresAt).getTime() <= Date.now()) {
      void refreshQr()
    }
  }, [pageState, refreshQr, remainingSeconds, session?.qrExpiresAt])

  useEffect(() => {
    if (pageState !== 'qr') return
    const timer = window.setInterval(() => void syncConnection(), SYNC_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [pageState, syncConnection])

  useEffect(() => {
    if (syncCooldownRemaining <= 0) return
    const timer = window.setInterval(() => setSyncCooldownRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [syncCooldownRemaining])

  const handleManualSync = async () => {
    if (syncCooldownRemaining > 0 || isSyncing || syncInFlight.current || pageState !== 'qr') return
    setSyncCooldownRemaining(MANUAL_SYNC_COOLDOWN_SECONDS)
    await syncConnection()
  }

  const resetFlow = () => {
    connectionStopped.current = false
    syncRequestId.current += 1
    setSession(null)
    setAttemptCount(0)
    setRemainingSeconds(0)
    setErrorMessage('')
    setPageState('initial')
  }

  const initials = useMemo(() => authState?.account.email.charAt(0).toUpperCase() || '?', [authState?.account.email])

  if (isAuthLoading || !authState) {
    return <main className="auth-shell" aria-busy="true"><section className="success-card"><LoaderCircle className="spin" size={25} aria-label="Loading" /></section></main>
  }

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${mobileNavOpen ? 'is-open' : ''}`}><DashboardNav onClose={() => setMobileNavOpen(false)} /></aside>
      {mobileNavOpen && <button className="nav-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className="portal-main">
        <header className="portal-header">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="workspace-context">Workspace <span className="context-muted">/ Create WhatsApp session</span></div>
          <div className="account-wrap">
            <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><span className="avatar">{initials}</span><span className="account-name">{authState.account.email}</span><ChevronDown size={15} /></button>
            {accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">{initials}</span><div><strong>{authState.account.email}</strong><span><span className="status-dot" /> Signed in</span><small>Plan: {authState.account.accountPlan} · Status: {authState.account.accountStatus}</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => { logout(); router.replace('/') }} role="menuitem"><LogOut size={16} /> Log out</button></div>}
          </div>
        </header>

        <main className="create-session-content">
          <button className="back-link" onClick={() => router.push('/sessions')}><ArrowLeft size={15} /> Back to Sessions</button>
          {pageState === 'initial' || pageState === 'creating' ? <section className="create-session-card"><div className="eyebrow">Connections</div><h1>Create WhatsApp session</h1><p className="create-session-lede">Choose a name to identify this WhatsApp connection.</p><form className="create-session-form" onSubmit={handleSubmit} noValidate><label htmlFor="session-name">Session name</label><input id="session-name" value={sessionName} onChange={(event) => { setSessionName(event.target.value); setErrorMessage('') }} placeholder="e.g. Customer Support" disabled={pageState === 'creating'} autoComplete="off" aria-invalid={Boolean(errorMessage && pageState === 'initial')} /><p className="field-hint">Choose a name to identify this WhatsApp connection.</p>{errorMessage && pageState === 'initial' && <p className="field-error">{errorMessage}</p>}<div className="create-session-actions"><button type="button" className="secondary-button" onClick={() => router.push('/sessions')} disabled={pageState === 'creating'}>Cancel</button><button type="submit" className="primary-button" disabled={!sessionName.trim() || pageState === 'creating'}>{pageState === 'creating' ? <><LoaderCircle className="spin" size={16} /> Creating session...</> : <>Create Session</>}</button></div></form></section> : null}

          {pageState === 'qr' && session && <section className="connection-card"><div className="connection-heading"><div><div className="eyebrow">Connect WhatsApp</div><h1>Scan this QR code</h1><p>Scan this QR code using WhatsApp to connect your account.</p></div><span className="session-status waiting"><span /> Waiting for QR scan</span></div><div className="qr-connection-grid"><div className="qr-display">{session.qrCode ? <QRCodeSVG key={session.qrCode} value={session.qrCode} size={280} aria-label="WhatsApp connection QR code" /> : <div className="qr-unavailable">QR code is not available yet.</div>}<strong>{session.qrExpiresAt ? formatRemaining(remainingSeconds) : '--:--'}</strong><span>{session.qrExpiresAt ? 'QR expires in' : 'QR expiry unavailable'}</span></div><div className="scan-instructions"><h2>How to scan</h2><ol><li>Open WhatsApp on your phone.</li><li>Go to Settings.</li><li>Select Linked Devices.</li><li>Tap Link a Device.</li><li>Scan the QR code shown above.</li></ol><p className="attempt-note">QR refresh attempt: {attemptCount} of {MAX_ATTEMPTS}</p><button className="secondary-button sync-button" onClick={() => void handleManualSync()} disabled={isSyncing || syncCooldownRemaining > 0}>{isSyncing ? <><LoaderCircle className="spin" size={15} /> Checking...</> : <><RefreshCw size={15} /> Check Connection</>}{syncCooldownRemaining > 0 && <small>Try again in {syncCooldownRemaining} seconds</small>}</button></div></div></section>}

          {pageState === 'connected' && <section className="connection-card connection-success"><div className="success-icon"><Check size={27} /></div><h1>WhatsApp Connected Successfully</h1><p>Your WhatsApp session is now ready to use.</p><strong>Session: {sessionName}</strong><button className="primary-button" onClick={() => router.push('/sessions')}>Back to Sessions</button></section>}

          {pageState === 'error' && <section className="connection-card connection-error"><div className="dialog-icon"><AlertCircle size={21} /></div><h1>{errorKind === 'already-exists' ? 'Session name already exists' : errorKind === 'not-found' ? 'WhatsApp session could not be found' : 'Unable to connect WhatsApp session'}</h1><p>{errorKind === 'already-exists' ? `${errorMessage} Please use another session name or manage the existing session.` : errorKind === 'not-found' ? `${errorMessage} The session may have expired or been removed. Please create a new session.` : errorMessage}</p><div className="create-session-actions">{errorKind === 'already-exists' && <button className="secondary-button" onClick={resetFlow}>Change Session Name</button>}{errorKind === 'not-found' && <button className="secondary-button" onClick={resetFlow}>Create New Session</button>}{errorKind === 'generic' && <button className="secondary-button" onClick={resetFlow}>Try Again</button>}<button className="primary-button" onClick={() => router.push('/sessions')}>Back to Sessions</button></div></section>}
        </main>
      </div>
    </div>
  )
}

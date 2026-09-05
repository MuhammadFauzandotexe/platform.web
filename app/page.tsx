'use client'

import { FormEvent, useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  Menu,
  Settings,
  Sparkles,
  X,
  LoaderCircle,
  Building2,
  UserRound,
  ShieldCheck,
  ArrowRight,
  Copy,
  RefreshCw,
  Smartphone,
} from 'lucide-react'

type FormErrors = { email?: string; password?: string }
type View = 'login' | 'workspace' | 'logged-out'
type SetupState = 'default' | 'processing' | 'success' | 'error'
type SessionStatus = 'Ready' | 'Connecting' | 'Needs attention'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Page() {
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loginError, setLoginError] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [setupState, setSetupState] = useState<SetupState>('default')
  const [copied, setCopied] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('Ready')
  const [sessionId, setSessionId] = useState('')
  const [pairingState, setPairingState] = useState<'idle' | 'loading' | 'qr' | 'connected' | 'error'>('idle')
  const [pairingMessage, setPairingMessage] = useState('')

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    return nextErrors
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoggingIn) return
    setLoginError(false)
    if (Object.keys(validate()).length) return
    setIsLoggingIn(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (email.toLowerCase().includes('invalid')) {
      setLoginError(true)
      setIsLoggingIn(false)
      setPassword('')
      return
    }
    setIsLoggingIn(false)
    setView('workspace')
  }

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!workspaceName.trim() || setupState === 'processing' || setupState === 'success') return
    setSetupState('processing')
    setSessionStatus('Connecting')
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (workspaceName.toLowerCase().includes('error')) {
      setSetupState('error')
      setSessionStatus('Needs attention')
      return
    }
    setSessionId(`wa_${Math.random().toString(36).slice(2, 10)}`)
    setSessionStatus('Ready')
    setSetupState('success')
  }

  const handlePairSession = async () => {
    if (pairingState === 'loading' || pairingState === 'connected') return
    setPairingState('loading')
    setPairingMessage('Preparing a secure QR code for this tenant...')
    await new Promise((resolve) => setTimeout(resolve, 900))
    setPairingState('qr')
    setPairingMessage('Open WhatsApp on your phone, choose Linked devices, then scan this code.')
  }

  const handleSimulateScan = async () => {
    setPairingState('loading')
    setPairingMessage('Checking the scan...')
    await new Promise((resolve) => setTimeout(resolve, 800))
    setPairingState('connected')
    setPairingMessage('WhatsApp is connected and ready for customer conversations.')
  }

  const handlePairRetry = () => {
    setPairingState('idle')
    setPairingMessage('')
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    setIsLoggingOut(false)
    setLogoutConfirmOpen(false)
    setAccountOpen(false)
    setView('logged-out')
  }

  const copyWorkspaceId = async () => {
    await navigator.clipboard?.writeText('acme-business')
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  if (view === 'workspace') {
    return (
      <div className="portal-shell">
        <aside className={`portal-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
          <div className="sidebar-brand"><Sparkles size={18} /><span>Luma</span><button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
          <nav aria-label="Portal navigation"><p className="nav-label">Workspace</p><a className="nav-item active" href="#setup"><LayoutDashboard size={17} /> Setup</a><a className="nav-item muted-nav" href="#settings"><Settings size={17} /> Settings</a></nav>
          <div className="sidebar-footer">Connect <span>→</span> Teach <span>→</span> Automate</div>
        </aside>
        {mobileNavOpen && <button className="nav-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
        <div className="portal-main">
          <header className="portal-header"><button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="workspace-context"><span className="status-dot" /> Acme Business <span className="context-muted">/ WhatsApp session setup</span></div><div className="account-wrap"><button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><span className="avatar">JD</span><span className="account-name">Jordan Davis</span><ChevronDown size={15} /></button>{accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">JD</span><div><strong>Jordan Davis</strong><span>{email || 'you@yourbusiness.com'}</span><small><span className="status-dot" /> Signed in</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => setLogoutConfirmOpen(true)} role="menuitem"><LogOut size={16} /> Log out</button></div>}</div></header>
          <main className="pairing-content" id="pairing">
            <div className="breadcrumb">Connections <span>/</span> WhatsApp</div>
            <div className="setup-heading"><div><div className="eyebrow">Connect</div><h1>Pair WhatsApp session using QR code</h1><p>Connect the Acme Business WhatsApp number so your team can start serving customers.</p></div><span className={`setup-status ${pairingState === 'connected' ? 'complete' : ''}`}><span className="status-dot" /> {pairingState === 'connected' ? 'Connected' : pairingState === 'qr' ? 'Waiting for scan' : pairingState === 'loading' ? 'Connecting' : 'Not connected'}</span></div>
            <div className="pairing-grid">
              <section className="setup-card pairing-card"><div className="card-heading"><div className="panel-icon"><Smartphone size={20} /></div><div><h2>Connect your WhatsApp</h2><p>Keep this session private to the active business tenant.</p></div></div>
                {pairingState === 'idle' && <div className="pairing-empty"><div className="pairing-illustration"><Smartphone size={28} /></div><h3>Ready to connect</h3><p>Request a secure QR code, then scan it from WhatsApp on your phone.</p><button className="primary-button submit-button" onClick={handlePairSession}><ArrowRight size={17} /> Request QR code</button></div>}
                {pairingState === 'loading' && <div className="pairing-empty" role="status"><LoaderCircle className="spin pairing-loader" size={34} /><h3>Preparing connection</h3><p>{pairingMessage}</p></div>}
                {pairingState === 'qr' && <div className="qr-stage"><div><span className="eyebrow">Waiting for QR scan</span><h3>Scan with WhatsApp</h3><p>{pairingMessage}</p><ol className="pairing-steps"><li>Open WhatsApp on your phone.</li><li>Tap Settings, then Linked devices.</li><li>Tap Link a device and scan this code.</li></ol></div><div className="qr-code" aria-label="WhatsApp pairing QR code"><span className="qr-corner top-left" /><span className="qr-corner top-right" /><span className="qr-corner bottom-left" /><div className="qr-pattern" /></div><button className="secondary-button" onClick={handleSimulateScan}>I&apos;ve scanned the code</button></div>}
                {pairingState === 'connected' && <div className="success-state pairing-success" role="status"><div className="success-icon"><Check size={25} /></div><div><h2>WhatsApp connected</h2><p>Your session is ready for customer conversations in <strong>Acme Business</strong>.</p></div></div>}
              </section>
              <aside className="setup-card owner-card"><div className="card-heading"><div className="panel-icon soft"><ShieldCheck size={20} /></div><div><h2>Tenant security</h2><p>Your QR code is scoped to this tenant.</p></div></div><div className="owner-row"><span className="avatar large">JD</span><div><strong>Acme Business</strong><span>{email || 'you@yourbusiness.com'}</span><small><ShieldCheck size={13} /> Private connection</small></div></div><div className="privacy-note"><ShieldCheck size={15} /><span>Only this tenant can view and use the pairing code.</span></div></aside>
            </div>
            {pairingState === 'error' && <section className="form-alert pairing-alert" role="alert"><AlertCircle size={17} /><span>We couldn&apos;t complete pairing. Request a new QR code and try again.</span><button className="copy-button" onClick={handlePairRetry}><RefreshCw size={14} /> Try again</button></section>}
          </main>
        </div>
        {logoutConfirmOpen && <div className="dialog-backdrop" role="presentation"><section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title"><div className="dialog-icon"><LogOut size={19} /></div><h2 id="logout-title">Log out of your account?</h2><p>You can log in again at any time.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setLogoutConfirmOpen(false)} disabled={isLoggingOut}>Cancel</button><button className="danger-button" onClick={handleLogout} disabled={isLoggingOut}>{isLoggingOut ? <><LoaderCircle className="spin" size={16} /> Logging out...</> : <><LogOut size={16} /> Log out</>}</button></div></section></div>}
      </div>
    )
  }

  if (view === 'logged-out') return <main className="auth-shell"><section className="success-card"><div className="brand-mark"><Sparkles size={18} /><span>Luma</span></div><div className="success-icon"><Check size={26} /></div><h1>You&apos;re logged out</h1><p>Your session has ended.</p><button className="primary-button" onClick={() => { setView('login'); setEmail(''); setPassword(''); setErrors({}) }}>Log in again</button></section></main>

  return <main className="auth-shell"><section className="auth-card" aria-labelledby="page-title"><header className="auth-header"><div className="brand-mark"><Sparkles size={18} /><span>Luma</span></div><h1 id="page-title">Welcome back</h1><p>Log in to set up your AI customer service workspace.</p></header>{loginError && <div className="form-alert" role="alert"><AlertCircle size={17} /><span>The email or password is incorrect. Check your details and try again.</span></div>}<form className="login-form" onSubmit={handleLogin} noValidate><div className="field-group"><label htmlFor="email">Email address</label><div className={`input-wrap ${errors.email ? 'has-error' : ''}`}><Mail size={18} aria-hidden="true" /><input id="email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" value={email} onChange={(event) => { setEmail(event.target.value); setLoginError(false) }} onBlur={validate} disabled={isLoggingIn} aria-invalid={Boolean(errors.email)} /></div>{errors.email && <p className="field-error">{errors.email}</p>}</div><div className="field-group"><label htmlFor="password">Password</label><div className={`input-wrap ${errors.password ? 'has-error' : ''}`}><LockKeyhole size={18} aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setLoginError(false) }} onBlur={validate} disabled={isLoggingIn} aria-invalid={Boolean(errors.password)} /><button className="visibility-button" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={isLoggingIn}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <p className="field-error">{errors.password}</p>}</div><button className="primary-button submit-button" type="submit" disabled={!email.trim() || !password || isLoggingIn}>{isLoggingIn ? <><LoaderCircle className="spin" size={17} /> Logging in...</> : <>Log in <ArrowRight size={17} /></>}</button></form><p className="login-prompt">Need an account? <a href="#register">Create one</a></p></section></main>
}

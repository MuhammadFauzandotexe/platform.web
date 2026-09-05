'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, LoaderCircle, LogOut, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { DashboardNav } from './dashboard-nav'

type PlaceholderProps = {
  title: string
  description: string
}

export function ProtectedPlaceholder({ title, description }: PlaceholderProps) {
  const router = useRouter()
  const { authState, isAuthLoading, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && !authState) router.replace('/')
  }, [authState, isAuthLoading, router])

  if (isAuthLoading || !authState) {
    return <main className="auth-shell" aria-busy="true"><section className="success-card"><LoaderCircle className="spin" size={25} aria-label="Loading" /></section></main>
  }

  const email = authState.account.email
  const initial = email.charAt(0).toUpperCase() || '?'

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <DashboardNav onClose={() => setMobileNavOpen(false)} />
      </aside>
      {mobileNavOpen && <button className="nav-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" />}
      <div className="portal-main">
        <header className="portal-header">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="workspace-context">Workspace <span className="context-muted">/ {title}</span></div>
          <div className="account-wrap">
            <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
              <span className="avatar">{initial}</span><span className="account-name">{email}</span><ChevronDown size={15} />
            </button>
            {accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">{initial}</span><div><strong>{email}</strong><span><span className="status-dot" /> Signed in</span><small>Plan: {authState.account.accountPlan} · Status: {authState.account.accountStatus}</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => { logout(); router.replace('/') }} role="menuitem"><LogOut size={16} /> Log out</button></div>}
          </div>
        </header>
        <main className="portal-content">
          <div className="eyebrow">Workspace</div>
          <h1>{title}</h1>
          <p className="portal-lede">{description}</p>
          <section className="welcome-panel"><div className="panel-icon"><LoaderCircle size={20} /></div><div><h2>Coming soon</h2><p>This area is ready for the next stage of your workspace.</p></div></section>
        </main>
      </div>
    </div>
  )
}

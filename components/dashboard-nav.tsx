'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, LayoutDashboard, MessageCircle, Settings, Sparkles, X } from 'lucide-react'

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sessions', label: 'Sessions', icon: MessageCircle },
]

export function DashboardNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const dashboardIsActive = pathname === '/' || pathname === '/dashboard'

  return (
    <>
      <div className="sidebar-brand">
        <Sparkles size={18} />
        <span>Luma</span>
        {onClose && <button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>}
      </div>
      <nav aria-label="Workspace navigation">
        <p className="nav-label">Workspace</p>
        {navigation.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard' ? dashboardIsActive : pathname === href
          return (
            <Link className={`nav-item ${isActive ? 'active' : ''}`} href={href} key={href} onClick={onClose}>
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
        <p className="nav-label nav-label-spaced">AI</p>
        <Link className={`nav-item ${pathname === '/knowledge' ? 'active' : ''}`} href="/knowledge" onClick={onClose}><Brain size={17} /> AI Knowledge</Link>
        <Link className={`nav-item ${pathname === '/ai-settings' ? 'active' : ''}`} href="/ai-settings" onClick={onClose}><Settings size={17} /> AI Personal Settings</Link>
      </nav>
      <div className="sidebar-footer">Connect <span>→</span> Teach <span>→</span> Automate</div>
    </>
  )
}

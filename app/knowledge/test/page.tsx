'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  ChevronDown,
  Eye,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  Search,
} from 'lucide-react'
import { DashboardNav } from '../../../components/dashboard-nav'
import { useAuth } from '../../../components/auth-provider'
import { ApiError } from '../../../lib/api-client'
import { queryKnowledge, type KnowledgeQueryResult } from '../../../lib/knowledge'

const exampleQuestions = [
  'Bisa bayar pakai apa saja?',
  'Berapa lama proses pengiriman?',
  'Bagaimana cara mengembalikan produk?',
  'Bagaimana jika produk yang saya terima rusak?',
]

const relevance = (score: number) => {
  if (score >= 0.8) return 'Excellent Match'
  if (score >= 0.65) return 'Strong Match'
  if (score >= 0.5) return 'Relevant'
  if (score >= 0.35) return 'Possible Match'
  return 'Weak Match'
}

const percentage = (score: number) => Math.max(0, Math.min(100, Math.round(score * 100)))

export default function KnowledgeTestPage() {
  const router = useRouter()
  const { authState, isAuthLoading, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [results, setResults] = useState<KnowledgeQueryResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchedQuestion, setSearchedQuestion] = useState('')

  const search = useCallback(async () => {
    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 3) {
      setError('Please enter a question to test your knowledge.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await queryKnowledge(trimmedQuestion)
      setResults(response.results)
      setTotalResults(response.totalResults)
      setSearchedQuestion(trimmedQuestion)
      setHasSearched(true)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) return
      setError('Unable to search knowledge. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }, [question])

  useEffect(() => {
    if (!isAuthLoading && !authState) router.replace('/login')
  }, [authState, isAuthLoading, router])

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
          <div className="workspace-context">Workspace <span className="context-muted">/ AI Knowledge Test</span></div>
          <div className="account-wrap">
            <button className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu"><span className="avatar">{initials}</span><span className="account-name">{authState.account.email}</span><ChevronDown size={15} /></button>
            {accountOpen && <div className="account-menu" role="menu"><div className="account-details"><span className="avatar large">{initials}</span><div><strong>{authState.account.email}</strong><span><span className="status-dot" /> Signed in</span><small>Plan: {authState.account.accountPlan} · Status: {authState.account.accountStatus}</small></div></div><div className="menu-divider" /><button className="logout-item" onClick={() => { logout(); router.replace('/') }} role="menuitem"><LogOut size={16} /> Log out</button></div>}
          </div>
        </header>

        <main className="knowledge-test-content">
          <button className="back-link" onClick={() => router.push('/knowledge')}><ArrowLeft size={15} /> AI Knowledge</button>
          <div className="knowledge-test-heading"><div className="eyebrow">AI Knowledge</div><h1>AI Knowledge Test</h1><p>Test what information your AI finds when you ask a question.</p></div>
          <p className="knowledge-test-helper"><Brain size={16} /> Use this tool to check how well your AI Knowledge matches the questions your users may ask.</p>

          <section className="knowledge-query-card">
            <div className="knowledge-query-title"><div className="panel-icon"><Search size={19} /></div><div><h2>Ask a question</h2><p>This helps you test whether your knowledge is relevant and easy for the AI to retrieve.</p></div></div>
            <textarea className="knowledge-query-input" value={question} onChange={(event) => { setQuestion(event.target.value); if (error) setError('') }} placeholder="Example: What payment methods do you accept?" disabled={loading} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void search() }} />
            {error && <div className="knowledge-query-error" role="alert"><AlertCircle size={16} /> {error}</div>}
            <div className="knowledge-query-footer"><div className="knowledge-examples"><span>Try an example</span>{exampleQuestions.map((example) => <button key={example} onClick={() => { setQuestion(example); setError('') }} disabled={loading}>{example}</button>)}</div><button className="primary-button knowledge-search-button" onClick={() => void search()} disabled={loading || question.trim().length < 3}>{loading ? <><LoaderCircle className="spin" size={16} /> Searching...</> : <><Search size={16} /> Search Knowledge</>}</button></div>
          </section>

          {loading && <section className="knowledge-searching" aria-live="polite"><LoaderCircle className="spin" size={20} /><div><strong>Searching your knowledge...</strong><span>Finding the most relevant information for your question.</span></div></section>}
          {hasSearched && !loading && <section className="knowledge-results"><div className="knowledge-results-heading"><div><div className="eyebrow">Search results</div><h2>Knowledge Results</h2><p>Found {totalResults} relevant {totalResults === 1 ? 'result' : 'results'} for &quot;{searchedQuestion}&quot;</p></div><span className="knowledge-result-count">{results.length}</span></div>{results.length === 0 ? <div className="knowledge-no-results"><div className="empty-icon"><Search size={22} /></div><h3>No relevant knowledge found</h3><p>Your AI could not find relevant information for this question. Try using different wording or add more relevant knowledge to your AI Knowledge.</p><button className="primary-button" onClick={() => router.push('/knowledge')}><Plus size={16} /> Add Knowledge</button></div> : <div className="knowledge-result-list">{results.map((result, index) => <KnowledgeResultCard key={`${result.pointId}-${result.chunkId}`} result={result} rank={index + 1} />)}</div>}</section>}
        </main>
      </div>
    </div>
  )
}

function KnowledgeResultCard({ result, rank }: { result: KnowledgeQueryResult; rank: number }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const scorePercentage = percentage(result.score)
  return <article className="knowledge-result-card"><div className="knowledge-result-top"><div className="knowledge-rank">#{rank}</div><div><span className={`knowledge-relevance relevance-${scorePercentage >= 80 ? 'excellent' : scorePercentage >= 65 ? 'strong' : scorePercentage >= 50 ? 'relevant' : 'possible'}`}>{relevance(result.score)}</span><strong>{scorePercentage}% relevance</strong></div></div><div className="knowledge-progress" aria-label={`${scorePercentage}% relevance`}><span style={{ width: `${scorePercentage}%` }} /></div><p className="knowledge-result-content">{result.content}</p><div className="knowledge-result-document"><span>Document ID</span><code>{result.documentId}</code></div><button className="knowledge-details-toggle" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}><Eye size={14} /> {detailsOpen ? 'Hide technical details' : 'Show technical details'} <ChevronDown className={detailsOpen ? 'rotate-180' : ''} size={14} /></button>{detailsOpen && <dl className="knowledge-technical-details"><div><dt>Point ID</dt><dd>{result.pointId}</dd></div><div><dt>Document ID</dt><dd>{result.documentId}</dd></div><div><dt>Chunk ID</dt><dd>{result.chunkId}</dd></div><div><dt>Chunk Index</dt><dd>{result.chunkIndex}</dd></div><div><dt>Raw Score</dt><dd>{result.score.toFixed(6)}</dd></div></dl>}</article>
}

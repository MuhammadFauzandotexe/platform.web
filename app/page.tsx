import Link from 'next/link'
import {
  ArrowRight,
  BrainCircuit,
  Check,
  MessageCircle,
  MessagesSquare,
  QrCode,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: 'WhatsApp Sessions',
    description: 'Connect and manage your WhatsApp sessions from one simple workspace.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Knowledge',
    description: 'Give your AI the information it needs to understand your business.',
  },
  {
    icon: MessagesSquare,
    title: 'Smart AI Responses',
    description: 'Create more relevant, natural conversations with every customer.',
  },
  {
    icon: Workflow,
    title: 'Multi-Session Management',
    description: 'Keep multiple WhatsApp connections organized as your business grows.',
  },
  {
    icon: Settings2,
    title: 'Personal AI Settings',
    description: 'Customize how your AI speaks, responds, and supports your team.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Workspaces',
    description: 'Keep each workspace and its knowledge private and isolated.',
  },
]

const steps = [
  { number: '01', title: 'Connect WhatsApp', description: 'Connect your WhatsApp account securely using a QR code.' },
  { number: '02', title: 'Add Your Knowledge', description: 'Add information about your business, products, or services.' },
  { number: '03', title: 'Configure Your AI', description: 'Customize how your AI responds to your customers.' },
  { number: '04', title: 'Let AI Handle Conversations', description: 'Deliver smarter responses using your own business knowledge.' },
]

export default function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="landing-brand" href="/">
          <span className="landing-brand-icon"><Sparkles size={17} /></span>
          <span>Luma</span>
        </Link>
        <div className="landing-nav-actions">
          <Link className="landing-sign-in" href="/login">Sign In</Link>
          <Link className="landing-button landing-button-small" href="/register">Get Started <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <section className="landing-hero landing-container">
        <div className="hero-copy">
          <div className="landing-kicker"><span className="kicker-dot" /> WhatsApp automation, made simple</div>
          <h1>Your WhatsApp.<br /><span>Smarter with AI.</span></h1>
          <p>Connect WhatsApp, teach your AI with your own knowledge, and create helpful customer conversations from one calm, powerful workspace.</p>
          <div className="hero-actions">
            <Link className="landing-button" href="/register">Get Started Free <ArrowRight size={17} /></Link>
            <Link className="landing-button-ghost" href="/login">Sign In <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-trust"><Check size={14} /> No complicated setup <Check size={14} /> Built for growing teams</div>
        </div>

        <div className="hero-visual" aria-label="Product preview showing WhatsApp connected to an AI assistant">
          <div className="hero-glow" />
          <div className="preview-window">
            <div className="preview-topbar"><span className="preview-dots"><i /><i /><i /></span><span className="preview-label">Luma workspace</span><span className="preview-pill">Live</span></div>
            <div className="preview-content">
              <div className="preview-heading"><div><span className="preview-eyebrow">Automation overview</span><strong>Make every reply count</strong></div><span className="preview-avatar">A</span></div>
              <div className="preview-flow">
                <div className="preview-card preview-card-main"><div className="preview-card-icon"><QrCode size={18} /></div><div><strong>WhatsApp Session</strong><span><b className="pulse-dot" /> Connected and ready</span></div><Check size={17} className="preview-check" /></div>
                <div className="flow-line"><span /></div>
                <div className="preview-card preview-card-offset"><div className="preview-card-icon knowledge-icon"><BrainCircuit size={18} /></div><div><strong>AI Knowledge</strong><span>Product info · Company FAQ</span></div><span className="preview-count">24</span></div>
                <div className="flow-line"><span /></div>
                <div className="preview-card preview-card-accent"><div className="preview-card-icon assistant-icon"><Sparkles size={18} /></div><div><strong>AI Assistant</strong><span>Ready to reply naturally</span></div><span className="preview-status">Active</span></div>
              </div>
              <div className="preview-message"><span className="message-avatar">AI</span><div><span>Suggested reply</span><strong>“Absolutely — I can help you with that.”</strong></div><MessagesSquare size={16} /></div>
            </div>
          </div>
          <div className="floating-stat"><span className="stat-icon"><MessageCircle size={16} /></span><div><strong>Conversations</strong><span>Growing smarter every day</span></div><span className="stat-arrow">↗</span></div>
        </div>
      </section>

      <section className="landing-section steps-section landing-container" id="how-it-works">
        <div className="section-heading centered"><span className="landing-kicker">Simple by design</span><h2>Get started in minutes</h2><p>Everything you need to move from a blank WhatsApp inbox to smarter conversations.</p></div>
        <div className="steps-grid">{steps.map((step) => <article className="step-card" key={step.number}><span className="step-number">{step.number}</span><div className="step-line" /><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
      </section>

      <section className="landing-section features-section" id="features">
        <div className="landing-container"><div className="section-heading"><span className="landing-kicker">One focused workspace</span><h2>Everything you need to build smarter conversations</h2><p>Powerful enough for your workflow, simple enough to get started today.</p></div>
          <div className="features-grid">{features.map(({ icon: Icon, title, description }) => <article className="feature-card" key={title}><span className="feature-icon"><Icon size={20} /></span><h3>{title}</h3><p>{description}</p><ArrowRight className="feature-arrow" size={17} /></article>)}</div>
        </div>
      </section>

      <section className="landing-section value-section landing-container">
        <div className="value-visual"><div className="value-orbit orbit-one" /><div className="value-orbit orbit-two" /><div className="value-center"><Sparkles size={28} /><span>AI</span></div><span className="value-node node-one"><MessageCircle size={17} /></span><span className="value-node node-two"><BrainCircuit size={17} /></span><span className="value-node node-three"><ShieldCheck size={17} /></span></div>
        <div className="value-copy"><span className="landing-kicker">Made for momentum</span><h2>Built to make AI automation simple.</h2><p>Spend less time managing tools and more time helping customers. Luma brings your WhatsApp connections, business knowledge, and AI settings together in one clear workspace.</p><div className="value-list"><span><Check size={16} /> No complicated setup</span><span><Check size={16} /> Connect WhatsApp in minutes</span><span><Check size={16} /> Teach AI using your own knowledge</span><span><Check size={16} /> Manage everything from one workspace</span></div><Link className="text-link" href="/register">Build your smarter workspace <ArrowRight size={16} /></Link></div>
      </section>

      <section className="landing-cta landing-container"><div><span className="landing-kicker">Ready when you are</span><h2>Ready to make your WhatsApp smarter?</h2><p>Connect your WhatsApp, add your knowledge, and start building better conversations.</p></div><div className="cta-actions"><Link className="landing-button" href="/register">Get Started <ArrowRight size={17} /></Link><Link className="landing-button-ghost" href="/login">Sign In <ArrowRight size={16} /></Link></div></section>

      <footer className="landing-footer landing-container"><Link className="landing-brand" href="/"><span className="landing-brand-icon"><Sparkles size={15} /></span><span>Luma</span></Link><p>Smarter WhatsApp conversations, powered by your knowledge.</p><span className="footer-copy">© {new Date().getFullYear()} Luma</span></footer>
    </main>
  )
}

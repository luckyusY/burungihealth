import Link from 'next/link';

export const metadata = {
  title: 'MyUploader – Auto-post from Telegram to TikTok',
  description: 'MyUploader lets you automatically upload videos from Telegram to your TikTok account. Connect once, post effortlessly.',
};

export default function Home() {
  return (
    <main style={s.main}>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <span style={s.badge}>Telegram → TikTok</span>
          <h1 style={s.h1}>Upload to TikTok<br />directly from Telegram</h1>
          <p style={s.heroSub}>
            MyUploader connects your Telegram bot to your TikTok account.
            Forward any video — it posts automatically. No apps, no manual uploading.
          </p>
          <div style={s.heroBtns}>
            <a href="mailto:nkundimanarugirayahaya@gmail.com" style={s.btnPrimary}>Get Early Access</a>
            <Link href="#how-it-works" style={s.btnOutline}>See How It Works</Link>
          </div>
        </div>
        <div style={s.heroVisual}>
          <div style={s.flowCard}>
            <div style={s.flowStep}>
              <div style={s.flowIcon}>📩</div>
              <div>
                <div style={s.flowLabel}>Step 1</div>
                <div style={s.flowText}>Forward video to Telegram bot</div>
              </div>
            </div>
            <div style={s.flowArrow}>↓</div>
            <div style={s.flowStep}>
              <div style={s.flowIcon}>⚡</div>
              <div>
                <div style={s.flowLabel}>Step 2</div>
                <div style={s.flowText}>MyUploader processes it automatically</div>
              </div>
            </div>
            <div style={s.flowArrow}>↓</div>
            <div style={s.flowStep}>
              <div style={s.flowIcon}>🎵</div>
              <div>
                <div style={s.flowLabel}>Step 3</div>
                <div style={s.flowText}>Video goes live on your TikTok</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={s.section} id="features">
        <div style={s.sectionInner}>
          <h2 style={s.h2}>Why MyUploader?</h2>
          <p style={s.sectionSub}>Built for creators who want to post more without the hassle.</p>
          <div style={s.featGrid}>
            {[
              { icon: '🤖', title: 'Fully Automated', desc: 'Set it up once. Every video you forward gets uploaded to TikTok without any extra steps.' },
              { icon: '🔐', title: 'Secure OAuth Login', desc: 'We use TikTok\'s official Login Kit. Your password is never stored — only a secure access token.' },
              { icon: '⚡', title: 'Instant Posting', desc: 'Videos are processed and submitted to TikTok within seconds of being forwarded.' },
              { icon: '📊', title: 'Upload History', desc: 'Track every upload — see what posted, what failed, and when.' },
              { icon: '📱', title: 'Works on Any Device', desc: 'Telegram is available everywhere. Trigger uploads from your phone, tablet, or desktop.' },
              { icon: '🛡️', title: 'Privacy First', desc: 'Your videos are deleted from our servers immediately after upload. We don\'t keep your content.' },
            ].map(f => (
              <div key={f.title} style={s.featCard}>
                <div style={s.featIcon}>{f.icon}</div>
                <h3 style={s.featTitle}>{f.title}</h3>
                <p style={s.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={s.sectionDark} id="how-it-works">
        <div style={s.sectionInner}>
          <h2 style={s.h2}>How It Works</h2>
          <p style={s.sectionSub}>Three steps and you&apos;re live on TikTok.</p>
          <div style={s.stepsGrid}>
            {[
              { n: '01', title: 'Connect Your TikTok', desc: 'Log in with TikTok via our secure OAuth flow. Authorize MyUploader to post on your behalf.' },
              { n: '02', title: 'Link Your Telegram Bot', desc: 'Start a chat with the MyUploader bot on Telegram. It\'s instant — no configuration needed.' },
              { n: '03', title: 'Forward & Post', desc: 'Forward any video to the bot. It automatically uploads to your TikTok account and confirms when done.' },
            ].map(step => (
              <div key={step.n} style={s.stepCard}>
                <div style={s.stepNum}>{step.n}</div>
                <h3 style={s.stepTitle}>{step.title}</h3>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div style={s.ctaInner}>
          <h2 style={s.ctaH2}>Ready to automate your TikTok uploads?</h2>
          <p style={s.ctaSub}>Join the waitlist and be the first to get access.</p>
          <a href="mailto:nkundimanarugirayahaya@gmail.com" style={s.btnPrimary}>
            Contact Us to Get Started
          </a>
          <p style={s.ctaLinks}>
            <Link href="/terms" style={s.footLink}>Terms of Service</Link>
            {' · '}
            <Link href="/privacy" style={s.footLink}>Privacy Policy</Link>
          </p>
        </div>
      </section>

    </main>
  );
}

const s = {
  main: {
    background: '#0a0a0a',
    color: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // Hero
  hero: {
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px 60px',
    gap: '60px',
    flexWrap: 'wrap',
    background: 'radial-gradient(ellipse at 20% 50%, rgba(255,0,80,0.08) 0%, transparent 60%), #0a0a0a',
  },
  heroInner: {
    flex: '1 1 400px',
    maxWidth: '560px',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,0,80,0.12)',
    color: '#ff2d55',
    border: '1px solid rgba(255,0,80,0.3)',
    borderRadius: '999px',
    padding: '4px 14px',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '20px',
  },
  h1: {
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: '800',
    lineHeight: '1.15',
    marginBottom: '20px',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '1.1rem',
    color: '#a3a3a3',
    lineHeight: '1.7',
    marginBottom: '36px',
    maxWidth: '460px',
  },
  heroBtns: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    background: '#ff2d55',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '0.95rem',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'opacity 0.2s',
  },
  btnOutline: {
    background: 'transparent',
    color: '#f5f5f5',
    padding: '14px 28px',
    borderRadius: '999px',
    fontWeight: '600',
    fontSize: '0.95rem',
    textDecoration: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'inline-block',
  },

  // Flow card
  heroVisual: {
    flex: '0 1 340px',
    display: 'flex',
    justifyContent: 'center',
  },
  flowCard: {
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '20px',
    padding: '32px',
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  flowStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px',
    background: '#1a1a1a',
    borderRadius: '12px',
  },
  flowIcon: {
    fontSize: '1.8rem',
    flexShrink: 0,
  },
  flowLabel: {
    fontSize: '0.72rem',
    color: '#ff2d55',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '3px',
  },
  flowText: {
    fontSize: '0.9rem',
    color: '#e5e5e5',
    fontWeight: '500',
  },
  flowArrow: {
    textAlign: 'center',
    color: '#444',
    fontSize: '1.2rem',
    padding: '2px 0',
  },

  // Sections
  section: {
    padding: '80px 24px',
    background: '#0a0a0a',
  },
  sectionDark: {
    padding: '80px 24px',
    background: '#0f0f0f',
    borderTop: '1px solid #1a1a1a',
    borderBottom: '1px solid #1a1a1a',
  },
  sectionInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    textAlign: 'center',
  },
  h2: {
    fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
    fontWeight: '800',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  sectionSub: {
    color: '#a3a3a3',
    fontSize: '1.05rem',
    marginBottom: '52px',
  },

  // Features grid
  featGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    textAlign: 'left',
  },
  featCard: {
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '16px',
    padding: '28px',
  },
  featIcon: {
    fontSize: '2rem',
    marginBottom: '14px',
  },
  featTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#f5f5f5',
  },
  featDesc: {
    fontSize: '0.9rem',
    color: '#a3a3a3',
    lineHeight: '1.65',
  },

  // Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
    textAlign: 'left',
  },
  stepCard: {
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '16px',
    padding: '32px',
  },
  stepNum: {
    fontSize: '2.5rem',
    fontWeight: '900',
    color: '#ff2d55',
    opacity: 0.6,
    marginBottom: '16px',
    letterSpacing: '-0.04em',
  },
  stepTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '10px',
    color: '#f5f5f5',
  },
  stepDesc: {
    fontSize: '0.9rem',
    color: '#a3a3a3',
    lineHeight: '1.65',
  },

  // CTA
  ctaSection: {
    padding: '100px 24px',
    background: 'radial-gradient(ellipse at center, rgba(255,0,80,0.1) 0%, transparent 70%), #0a0a0a',
    textAlign: 'center',
  },
  ctaInner: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaH2: {
    fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
    fontWeight: '800',
    marginBottom: '14px',
    letterSpacing: '-0.02em',
  },
  ctaSub: {
    color: '#a3a3a3',
    fontSize: '1.05rem',
    marginBottom: '32px',
  },
  ctaLinks: {
    marginTop: '28px',
    fontSize: '0.85rem',
    color: '#555',
  },
  footLink: {
    color: '#666',
    textDecoration: 'underline',
  },
};

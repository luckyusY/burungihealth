export const metadata = {
  title: 'Connect TikTok – MyUploader',
  description: 'Connect your TikTok account to MyUploader to start auto-posting videos from Telegram.',
};

export default async function ConnectPage({ searchParams }) {
  const params = await searchParams;
  const chatId = params?.chat_id;
  const success = params?.success;
  const error = params?.error;

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>MyUploader</div>

        {success ? (
          <>
            <div style={s.successIcon}>✅</div>
            <h1 style={s.h1}>TikTok Connected!</h1>
            <p style={s.sub}>
              Your TikTok account is now linked. Go back to Telegram and send a video to start uploading automatically.
            </p>
            <div style={s.tip}>
              <strong>What to do next:</strong><br />
              Open your Telegram bot and forward any video. It will be posted to your TikTok automatically.
            </div>
          </>
        ) : error ? (
          <>
            <div style={s.errorIcon}>❌</div>
            <h1 style={s.h1}>Connection Failed</h1>
            <p style={s.sub}>
              Something went wrong: <strong>{decodeURIComponent(error)}</strong>
            </p>
            <p style={s.sub}>Please go back to Telegram and use /connect to try again.</p>
          </>
        ) : !chatId ? (
          <>
            <div style={s.warningIcon}>⚠️</div>
            <h1 style={s.h1}>Missing Telegram ID</h1>
            <p style={s.sub}>
              This page must be opened from the Telegram bot. Send <strong>/connect</strong> to the bot and click the link it sends you.
            </p>
          </>
        ) : (
          <>
            <h1 style={s.h1}>Connect your TikTok</h1>
            <p style={s.sub}>
              Authorize MyUploader to post videos to your TikTok account on your behalf.
              You can revoke access at any time from TikTok settings.
            </p>

            <div style={s.steps}>
              <div style={s.step}><span style={s.stepNum}>1</span> Click the button below</div>
              <div style={s.step}><span style={s.stepNum}>2</span> Log in to TikTok &amp; approve</div>
              <div style={s.step}><span style={s.stepNum}>3</span> Send videos via Telegram — they post automatically</div>
            </div>

            <a
              href={`/api/tiktok/auth?chat_id=${chatId}`}
              style={s.btn}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
              </svg>
              Connect TikTok Account
            </a>

            <p style={s.disclaimer}>
              We only use your TikTok authorization to upload videos you send us.
              We never read your existing content or data.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  logo: {
    color: '#ff2d55',
    fontSize: '1.4rem',
    fontWeight: '800',
    marginBottom: '32px',
    letterSpacing: '-0.02em',
  },
  h1: {
    color: '#f5f5f5',
    fontSize: '1.6rem',
    fontWeight: '700',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  sub: {
    color: '#a3a3a3',
    fontSize: '0.95rem',
    lineHeight: '1.65',
    marginBottom: '24px',
  },
  steps: {
    background: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '28px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#e5e5e5',
    fontSize: '0.9rem',
  },
  stepNum: {
    background: '#ff2d55',
    color: '#fff',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ff2d55',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '1rem',
    textDecoration: 'none',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '16px',
  },
  disclaimer: {
    color: '#555',
    fontSize: '0.78rem',
    lineHeight: '1.5',
  },
  successIcon: { fontSize: '3rem', marginBottom: '16px' },
  errorIcon: { fontSize: '3rem', marginBottom: '16px' },
  warningIcon: { fontSize: '3rem', marginBottom: '16px' },
  tip: {
    background: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '12px',
    padding: '16px',
    color: '#6da376',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    textAlign: 'left',
  },
};

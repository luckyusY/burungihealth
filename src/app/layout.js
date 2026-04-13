import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "MyUploader – Auto-post from Telegram to TikTok",
  description: "MyUploader lets you automatically upload videos from Telegram to your TikTok account. Connect once, post effortlessly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="rw">
      <body className={`${outfit.variable} ${playfair.variable}`}>
        {/* Global Navigation Bar */}
        <nav className="navbar" style={{ top: 0 }}>
          <div className="container nav-container">
            <Link href="/" className="logo" style={{ color: '#ff2d55' }}>MyUploader</Link>
            <div className="nav-links">
              <Link href="/#how-it-works">How It Works</Link>
              <Link href="/#features">Features</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <a href="mailto:nkundimanarugirayahaya@gmail.com" className="nav-btn" style={{ background: '#ff2d55' }}>Get Access</a>
            </div>
          </div>
        </nav>

        {children}

        {/* Global Footer */}
        <footer className="footer">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="logo" style={{ color: '#ff2d55', fontSize: '1.6rem' }}>MyUploader</span>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Automatically upload videos from Telegram to TikTok.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/terms" className="footer-nav-link">Terms of Service</Link>
              <Link href="/privacy" className="footer-nav-link">Privacy Policy</Link>
              <a href="mailto:nkundimanarugirayahaya@gmail.com" className="footer-nav-link">Contact</a>
            </div>
            <p className="copyright">&copy; {new Date().getFullYear()} MyUploader. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

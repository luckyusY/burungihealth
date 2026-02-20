import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { CONTACT, buildWhatsAppUrl } from "@/lib/contact";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "BurungiHealth | Trusted Health Products in Rwanda",
  description: "Shop trusted health products from BurungiHealth. Fast, discreet delivery across Rwanda. Order via WhatsApp and find us in Kigali, Rwanda.",
};

async function getFooterCategories() {
  const { data } = await supabase.from('categories').select('name, slug').order('name').limit(10);
  return data || [];
}

export default async function RootLayout({ children }) {
  const footerCategories = await getFooterCategories();
  const whatsappPrimaryUrl = buildWhatsAppUrl(CONTACT.primaryPhoneDigits);
  return (
    <html lang="rw">
      <body className={`${outfit.variable} ${playfair.variable}`}>
        {/* Top Contact Bar */}
        <div className="top-bar">
          <div className="container top-bar-container">
            <div className="info-group">
              <span className="info-label">Order via WhatsApp:</span>
              {CONTACT.phones.map((phone, idx) => (
                <span key={phone.digits} className="top-phone">
                  {idx > 0 && <span className="separator">|</span>}
                  <a href={buildWhatsAppUrl(phone.digits)}>{phone.display}</a>
                </span>
              ))}
            </div>
            <div className="cta-group">
              <span className="address-label">Address:</span>
              <a href={CONTACT.address.mapUrl} target="_blank" rel="noreferrer" className="address-link">
                {CONTACT.address.title}
              </a>
            </div>
          </div>
        </div>

        {/* Global Navigation Bar */}
        <nav className="navbar">
          <div className="container nav-container">
            <Link href="/" className="logo">BurungiHealth</Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <a href={whatsappPrimaryUrl} target="_blank" rel="noreferrer" className="nav-btn">WhatsApp Us</a>
            </div>
          </div>
        </nav>

        {children}

        {/* Global Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <h3 className="logo">BurungiHealth</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto', lineHeight: '1.6' }}>
                  Trusted health &amp; wellness products. Fast, discreet delivery across Rwanda.
                </p>
              </div>
              {footerCategories.length > 0 && (
                <div className="footer-nav">
                  <h4 className="footer-nav-title">Shop by Category</h4>
                  <ul className="footer-nav-list">
                    {footerCategories.map(cat => (
                      <li key={cat.slug}>
                        <Link href={`/category/${cat.slug}`} className="footer-nav-link">{cat.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="footer-contact-block">
                <h4 className="footer-nav-title">Contact & Address</h4>
                <div className="footer-contacts">
                  <p className="footer-address-title">{CONTACT.address.title}</p>
                  <p className="footer-address-line">{CONTACT.address.line1}</p>
                  <p className="footer-address-line">{CONTACT.address.line2}</p>
                  <p><a href={CONTACT.address.mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a></p>
                  {CONTACT.phones.map(phone => (
                    <p key={phone.digits}><a href={buildWhatsAppUrl(phone.digits)}>{phone.display}</a></p>
                  ))}
                </div>
              </div>
            </div>
            <p className="copyright">&copy; {new Date().getFullYear()} BurungiHealth. All rights reserved.</p>
          </div>
        </footer>

        {/* Floating WhatsApp Button (Bottom Right) */}
        <a href={whatsappPrimaryUrl} className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </body>
    </html>
  );
}

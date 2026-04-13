export const metadata = {
  title: 'Privacy Policy – MyUploader',
  description: 'Privacy Policy for MyUploader, a TikTok video upload automation tool.',
};

export default function PrivacyPolicy() {
  const effectiveDate = 'April 13, 2026';

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.meta}>Effective Date: {effectiveDate}</p>

        <p style={styles.p}>
          This Privacy Policy explains how <strong>MyUploader</strong> ("we", "us", or "our") collects, uses,
          and protects information when you use our video upload automation service. We are committed to
          protecting your privacy and handling your data responsibly.
        </p>

        <h2 style={styles.h2}>1. Information We Collect</h2>
        <p style={styles.p}>When you use MyUploader, we may collect the following information:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <strong>TikTok Account Information:</strong> Your TikTok user ID, display name, and profile data
            provided through TikTok's OAuth authorization flow (Login Kit).
          </li>
          <li style={styles.li}>
            <strong>Access Tokens:</strong> OAuth access tokens granted by TikTok, used to post content on
            your behalf. These are stored securely and used only to perform uploads you initiate.
          </li>
          <li style={styles.li}>
            <strong>Telegram Data:</strong> Video files and metadata you forward through your Telegram bot
            for upload. We process these temporarily and do not permanently store Telegram message content.
          </li>
          <li style={styles.li}>
            <strong>Upload Logs:</strong> Timestamps, upload status, and TikTok post identifiers for
            videos you upload, used for tracking and debugging purposes.
          </li>
          <li style={styles.li}>
            <strong>Technical Data:</strong> IP address, device type, and usage logs collected automatically
            for security and service improvement.
          </li>
        </ul>

        <h2 style={styles.h2}>2. How We Use Your Information</h2>
        <p style={styles.p}>We use the information we collect to:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Authenticate your TikTok account and perform video uploads on your behalf.</li>
          <li style={styles.li}>Process videos received via Telegram and submit them to TikTok's Content Posting API.</li>
          <li style={styles.li}>Track upload history and provide status feedback to you.</li>
          <li style={styles.li}>Diagnose errors, fix bugs, and improve the reliability of the App.</li>
          <li style={styles.li}>Comply with applicable laws and TikTok's developer platform requirements.</li>
        </ul>

        <h2 style={styles.h2}>3. TikTok API Data Usage</h2>
        <p style={styles.p}>
          MyUploader uses the TikTok Content Posting API and Login Kit. Data obtained through TikTok's API
          (including access tokens and account identifiers) is used solely to provide the upload service
          and is not shared with third parties, sold, or used for advertising purposes. We comply with
          TikTok's Developer Terms of Service and data handling requirements.
        </p>

        <h2 style={styles.h2}>4. Data Sharing</h2>
        <p style={styles.p}>
          We do not sell or rent your personal data. We may share information only in the following cases:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <strong>With TikTok:</strong> Content and metadata submitted to TikTok's API on your behalf.
          </li>
          <li style={styles.li}>
            <strong>Service Providers:</strong> Hosting and infrastructure providers who process data on
            our behalf under confidentiality agreements.
          </li>
          <li style={styles.li}>
            <strong>Legal Requirements:</strong> If required by law, court order, or to protect the rights
            and safety of users or the public.
          </li>
        </ul>

        <h2 style={styles.h2}>5. Data Retention</h2>
        <p style={styles.p}>
          We retain your TikTok access tokens only while your account is active. Video files received from
          Telegram are deleted after upload or after a failed upload attempt. Upload logs may be retained
          for up to 90 days for debugging purposes. You may request deletion of your data at any time.
        </p>

        <h2 style={styles.h2}>6. Your Rights</h2>
        <p style={styles.p}>You have the right to:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Access the data we hold about you.</li>
          <li style={styles.li}>Request correction or deletion of your data.</li>
          <li style={styles.li}>Revoke TikTok OAuth authorization at any time via your TikTok account settings.</li>
          <li style={styles.li}>Request that we stop processing your data.</li>
        </ul>
        <p style={styles.p}>
          To exercise these rights, contact us at:{' '}
          <a href="mailto:nkundimanarugirayahaya@gmail.com" style={styles.link}>nkundimanarugirayahaya@gmail.com</a>
        </p>

        <h2 style={styles.h2}>7. Security</h2>
        <p style={styles.p}>
          We implement industry-standard security measures to protect your data, including encrypted storage
          of access tokens and secure HTTPS connections. However, no system is completely secure and we
          cannot guarantee absolute security.
        </p>

        <h2 style={styles.h2}>8. Children's Privacy</h2>
        <p style={styles.p}>
          MyUploader is not intended for users under 13 years of age (or under 16 in the EU). We do not
          knowingly collect personal data from children. If we become aware that a child has provided us
          with personal data, we will delete it promptly.
        </p>

        <h2 style={styles.h2}>9. Third-Party Services</h2>
        <p style={styles.p}>
          Our App interacts with TikTok and Telegram. These platforms have their own privacy policies which
          govern how they handle your data. We encourage you to review:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <a href="https://www.tiktok.com/legal/privacy-policy" style={styles.link} target="_blank" rel="noreferrer">
              TikTok Privacy Policy
            </a>
          </li>
          <li style={styles.li}>
            <a href="https://telegram.org/privacy" style={styles.link} target="_blank" rel="noreferrer">
              Telegram Privacy Policy
            </a>
          </li>
        </ul>

        <h2 style={styles.h2}>10. Changes to This Policy</h2>
        <p style={styles.p}>
          We may update this Privacy Policy from time to time. We will notify users of significant changes
          by updating the Effective Date at the top of this page. Continued use of the App constitutes
          acceptance of the updated policy.
        </p>

        <h2 style={styles.h2}>11. Contact Us</h2>
        <p style={styles.p}>
          If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
        </p>
        <p style={styles.p}>
          Email: <a href="mailto:nkundimanarugirayahaya@gmail.com" style={styles.link}>nkundimanarugirayahaya@gmail.com</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    padding: '60px 20px',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '48px 56px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1a1a1a',
    lineHeight: '1.7',
  },
  h1: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#111',
  },
  h2: {
    fontSize: '1.15rem',
    fontWeight: '600',
    marginTop: '32px',
    marginBottom: '10px',
    color: '#222',
  },
  meta: {
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '28px',
  },
  p: {
    marginBottom: '14px',
    fontSize: '0.97rem',
  },
  ul: {
    paddingLeft: '24px',
    marginBottom: '14px',
  },
  li: {
    marginBottom: '6px',
    fontSize: '0.97rem',
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
  },
};

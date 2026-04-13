export const metadata = {
  title: 'Terms of Service – MyUploader',
  description: 'Terms of Service for MyUploader, a TikTok video upload automation tool.',
};

export default function TermsOfService() {
  const effectiveDate = 'April 13, 2026';

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.meta}>Effective Date: {effectiveDate}</p>

        <p style={styles.p}>
          Welcome to <strong>MyUploader</strong> ("the App", "we", "us", or "our"). By accessing or using MyUploader,
          you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the App.
        </p>

        <h2 style={styles.h2}>1. Description of Service</h2>
        <p style={styles.p}>
          MyUploader is a tool that allows authorized users to upload video content to TikTok automatically,
          using videos sourced from Telegram. The App integrates with TikTok's Content Posting API to perform
          these uploads on behalf of the authenticated TikTok account holder.
        </p>

        <h2 style={styles.h2}>2. Eligibility</h2>
        <p style={styles.p}>
          You must be at least 18 years old (or the age of majority in your jurisdiction) and have a valid
          TikTok account to use MyUploader. By using the App, you represent that you meet these requirements.
        </p>

        <h2 style={styles.h2}>3. TikTok Account and Authorization</h2>
        <p style={styles.p}>
          To use the App, you must authorize MyUploader to act on your behalf via TikTok's OAuth 2.0 login
          flow. You may revoke this authorization at any time through your TikTok account settings. You are
          solely responsible for all content uploaded to TikTok through the App using your account.
        </p>

        <h2 style={styles.h2}>4. Acceptable Use</h2>
        <p style={styles.p}>You agree not to use MyUploader to:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Upload content that violates TikTok's Community Guidelines or Terms of Service.</li>
          <li style={styles.li}>Upload copyrighted material without proper rights or permissions.</li>
          <li style={styles.li}>Upload content that is illegal, harmful, abusive, harassing, or deceptive.</li>
          <li style={styles.li}>Attempt to reverse-engineer, scrape, or interfere with the App or TikTok's platform.</li>
          <li style={styles.li}>Use the App for spam, unauthorized commercial messaging, or bulk automation in violation of TikTok's policies.</li>
        </ul>

        <h2 style={styles.h2}>5. Content Responsibility</h2>
        <p style={styles.p}>
          You retain full ownership of any content you upload through the App. We do not claim ownership
          over your videos or data. You are solely responsible for ensuring that all uploaded content complies
          with applicable laws and platform policies.
        </p>

        <h2 style={styles.h2}>6. Third-Party Platforms</h2>
        <p style={styles.p}>
          MyUploader integrates with TikTok and Telegram. Your use of those platforms is governed by their
          respective terms of service and privacy policies. We are not responsible for the actions, content,
          or data practices of TikTok or Telegram.
        </p>

        <h2 style={styles.h2}>7. Limitation of Liability</h2>
        <p style={styles.p}>
          To the maximum extent permitted by law, MyUploader and its developers shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising out of your use of the App,
          including but not limited to loss of data, failed uploads, or account suspension by TikTok.
        </p>

        <h2 style={styles.h2}>8. Disclaimers</h2>
        <p style={styles.p}>
          The App is provided "as is" without warranties of any kind, express or implied. We do not guarantee
          that the App will be error-free, uninterrupted, or that uploads to TikTok will always succeed.
        </p>

        <h2 style={styles.h2}>9. Modifications to Terms</h2>
        <p style={styles.p}>
          We reserve the right to update these Terms at any time. We will notify users of material changes
          by updating the Effective Date above. Continued use of the App after changes constitutes acceptance
          of the new Terms.
        </p>

        <h2 style={styles.h2}>10. Termination</h2>
        <p style={styles.p}>
          We may suspend or terminate your access to MyUploader at any time if you violate these Terms or
          if required to do so by applicable law or platform policy.
        </p>

        <h2 style={styles.h2}>11. Governing Law</h2>
        <p style={styles.p}>
          These Terms are governed by the laws of the jurisdiction in which the developer operates, without
          regard to conflict-of-law provisions.
        </p>

        <h2 style={styles.h2}>12. Contact</h2>
        <p style={styles.p}>
          If you have any questions about these Terms, please contact us at:{' '}
          <a href="mailto:nkundimanarugirayahaya@gmail.com" style={styles.link}>nkundimanarugirayahaya@gmail.com</a>
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

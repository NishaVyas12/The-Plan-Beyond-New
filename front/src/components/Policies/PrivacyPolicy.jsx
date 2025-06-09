import React from 'react';
import './Policy.css';

const PrivacyPolicy = () => {
  return (
    <div className="hero-policies">
      <div className="hero-policies__background">
        <div className="hero-policies__overlay">
          <div className="hero-policies__content">
            <h1 className="hero-policies__title">Privacy Policy</h1>
          </div>
        </div>
      </div>
      <div className="hero-policies__text-section">
        <p className="hero-policies__description">
          Effective Date: May 05, 2025
        </p>
        <p className="hero-policies__description">
          Your privacy is not a feature. It’s a promise.
        </p>
        <p className="hero-policies__description">
          This Privacy Policy explains how The Plan Beyond (TPB) collects, uses, stores, and protects your personal information when you use our platform.
        </p>
        <p className="hero-policies__description">
          By accessing or using TPB, you consent to the practices described in this policy.
        </p>

        <h2 className="hero-policies__subtitle">1. Information We Collect</h2>
        <p className="hero-policies__description">
          We collect the following types of information:
        </p>
        <h3 className="hero-policies__subtitle">a. Personal Information</h3>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Full name</li>
          <li className="hero-policies__list-item">Email address</li>
          <li className="hero-policies__list-item">Phone number</li>
          <li className="hero-policies__list-item">Date of birth</li>
          <li className="hero-policies__list-item">Relationship data (e.g., Ambassadors/Nominees)</li>
        </ul>
        <h3 className="hero-policies__subtitle">b. Uploaded Content</h3>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Contacts (Phone, email, social media)</li>
          <li className="hero-policies__list-item">Documents (e.g., wills, IDs, policies)</li>
          <li className="hero-policies__list-item">Photos, videos, messages</li>
          <li className="hero-policies__list-item">Account passwords</li>
          <li className="hero-policies__list-item">Subscription and reward details</li>
          <li className="hero-policies__list-item">Scheduled or posthumous messages</li>
        </ul>
        <h3 className="hero-policies__subtitle">c. Device & Usage Information</h3>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">IP address</li>
          <li className="hero-policies__list-item">Browser type</li>
          <li className="hero-policies__list-item">Operating system</li>
          <li className="hero-policies__list-item">Device identifiers</li>
          <li className="hero-policies__list-item">Usage logs (e.g., login times, actions taken)</li>
        </ul>

        <h2 className="hero-policies__subtitle">2. How We Use Your Information</h2>
        <p className="hero-policies__description">
          We use your data to:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Provide core services such as storage, tagging, and scheduled messages</li>
          <li className="hero-policies__list-item">Facilitate Ambassador/Nominee access management</li>
          <li className="hero-policies__list-item">Improve platform performance and user experience</li>
          <li className="hero-policies__list-item">Communicate with you regarding updates or support</li>
          <li className="hero-policies__list-item">Ensure account security and fraud detection</li>
          <li className="hero-policies__list-item">Comply with legal obligations</li>
        </ul>

        <h2 className="hero-policies__subtitle">3. Sharing and Disclosure</h2>
        <p className="hero-policies__description">
          We do not sell or rent your data.
        </p>
        <p className="hero-policies__description">
          We only share data:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">With your designated Ambassadors or Nominees, after verification and only as per your permissions</li>
          <li className="hero-policies__list-item">With trusted third-party service providers (e.g., cloud storage, legal/insurance aggregators) under strict confidentiality agreements</li>
          <li className="hero-policies__list-item">If legally required by law, court order, or regulatory authority</li>
        </ul>

        <h2 className="hero-policies__subtitle">4. Data Security</h2>
        <p className="hero-policies__description">
          We use:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">AES-256 encryption for data at rest</li>
          <li className="hero-policies__list-item">TLS/SSL encryption for data in transit</li>
          <li className="hero-policies__list-item">Multi-factor authentication (MFA)</li>
          <li className="hero-policies__list-item">Role-based access control</li>
          <li className="hero-policies__list-item">Regular vulnerability scans and security audits</li>
          <li className="hero-policies__list-item">HIPAA & SOC 2-aligned protocols</li>
          <li className="hero-policies__list-item">Offline data downloads (e.g., USB backups) are secured with dynamic, expiring passwords.</li>
        </ul>

        <h2 className="hero-policies__subtitle">5. Your Rights & Controls</h2>
        <p className="hero-policies__description">
          You have the right to:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Access or update your personal information at any time</li>
          <li className="hero-policies__list-item">Request account deletion</li>
          <li className="hero-policies__list-item">Withdraw consent (subject to legal retention obligations)</li>
          <li className="hero-policies__list-item">Export your data</li>
          <li className="hero-policies__list-item">Designate who can access what after your passing</li>
        </ul>
        <p className="hero-policies__description">
          To exercise any of these rights, email us at <a href="mailto:privacy@theplanbeyond.com">privacy@theplanbeyond.com</a>
        </p>

        <h2 className="hero-policies__subtitle">6. Data Retention</h2>
        <p className="hero-policies__description">
          We retain your data:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">As long as your account is active</li>
          <li className="hero-policies__list-item">For a grace period post-death, as determined by your plan and nominee decisions</li>
          <li className="hero-policies__list-item">Unless otherwise instructed by you or your authorized representative</li>
        </ul>

        <h2 className="hero-policies__subtitle">7. Cookies and Tracking</h2>
        <p className="hero-policies__description">
          TPB uses cookies to:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Maintain session security</li>
          <li className="hero-policies__list-item">Analyze site usage for improvement</li>
          <li className="hero-policies__list-item">Store user preferences</li>
        </ul>
        <p className="hero-policies__description">
          You can manage cookie preferences via your browser settings.
        </p>

        <h2 className="hero-policies__subtitle">8. Children’s Privacy</h2>
        <p className="hero-policies__description">
          TPB is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If discovered, such data will be deleted promptly.
        </p>

        <h2 className="hero-policies__subtitle">9. International Transfers</h2>
        <p className="hero-policies__description">
          If you’re accessing TPB outside of India, your data may be transferred to, stored, and processed in regions with different data protection laws. We ensure all transfers comply with applicable legal standards.
        </p>

        <h2 className="hero-policies__subtitle">10. Changes to This Policy</h2>
        <p className="hero-policies__description">
          We may update this Privacy Policy periodically. Material changes will be communicated via email or dashboard notifications. Continued use of TPB means you accept the updated policy.
        </p>

        <h2 className="hero-policies__subtitle">11. Contact Us</h2>
        <p className="hero-policies__description">
          If you have questions about this policy or your data, contact us at:
        </p>
        <p className="hero-policies__description">
          email: <a href="mailto:privacy@theplanbeyond.com">privacy@theplanbeyond.com</a>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
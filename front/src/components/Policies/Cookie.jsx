import React from 'react';
import './Policy.css';

const Cookie = () => {
  return (
    <div className="hero-policies">
      <div className="cookie-policies__background">
        <div className="hero-policies__overlay">
          <div className="hero-policies__content">
            <h1 className="hero-policies__title">Cookie</h1>
          </div>
        </div>
      </div>
      <div className="hero-policies__text-section">
        <p className="hero-policies__description">
          Effective Date: May 05, 2025
        </p>
        <p className="hero-policies__description">
          At The Plan Beyond (TPB), we use cookies and similar technologies to enhance your browsing experience, analyze website performance, and secure your data. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.
        </p>

        <h2 className="hero-policies__subtitle">1. What Are Cookies?</h2>
        <p className="hero-policies__description">
          Cookies are small text files stored on your device (computer, tablet, or smartphone) when you visit a website. They help us recognize your browser and remember information about your visit, such as your preferences and login details.
        </p>

        <h2 className="hero-policies__subtitle">2. Types of Cookies We Use</h2>
        <h3 className="hero-policies__subtitle">a. Essential Cookies</h3>
        <p className="hero-policies__description">
          These are necessary for the platform to function properly. They enable core functionalities like secure login, session management, and data encryption.
        </p>
        <p className="hero-policies__description">
          Examples:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Session authentication</li>
          <li className="hero-policies__list-item">Ambassador verification</li>
          <li className="hero-policies__list-item">Password reset flow</li>
        </ul>
        <h3 className="hero-policies__subtitle">b. Performance & Analytics Cookies</h3>
        <p className="hero-policies__description">
          These cookies help us understand how users interact with our site, allowing us to improve functionality and design. Data is collected in aggregate and is anonymous.
        </p>
        <p className="hero-policies__description">
          Examples:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Google Analytics</li>
          <li className="hero-policies__list-item">Click tracking for feature usage</li>
        </ul>
        <h3 className="hero-policies__subtitle">c. Functional Cookies</h3>
        <p className="hero-policies__description">
          These allow the site to remember your preferences, such as language settings or dashboard view options.
        </p>
        <p className="hero-policies__description">
          Examples:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Saved filter settings</li>
          <li className="hero-policies__list-item">Remembered email addresses (if opted in)</li>
        </ul>
        <h3 className="hero-policies__subtitle">d. Third-Party Cookies</h3>
        <p className="hero-policies__description">
          In some cases, we use third-party tools or plugins (e.g., support chat, legal integrations) that may place cookies. We ensure they comply with applicable privacy standards.
        </p>

        <h2 className="hero-policies__subtitle">3. Why We Use Cookies</h2>
        <p className="hero-policies__description">
          To keep your account secure during sessions
        </p>
        <p className="hero-policies__description">
          To recognize returning users and personalize the dashboard
        </p>
        <p className="hero-policies__description">
          To measure how users engage with our features
        </p>
        <p className="hero-policies__description">
          To improve site performance and usability
        </p>
        <p className="hero-policies__description">
          To remember your preferences and settings
        </p>

        <h2 className="hero-policies__subtitle">4. Managing Cookie Preferences</h2>
        <p className="hero-policies__description">
          You have full control over the use of cookies:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Cookie Consent Banner: When you first visit TPB, you will see a banner asking for your cookie preferences. You can accept all cookies or customize your choices.</li>
          <li className="hero-policies__list-item">Browser Settings: Most web browsers allow you to disable or delete cookies from their settings panel.</li>
          <li className="hero-policies__list-item">Revoke Consent: You can revisit your cookie settings on our site at any time and update your preferences.</li>
        </ul>
        <p className="hero-policies__description">
          Please note that disabling essential cookies may affect the functionality of the platform.
        </p>

        <h2 className="hero-policies__subtitle">5. Data Retention</h2>
        <p className="hero-policies__description">
          Cookies typically remain on your device for a defined period, depending on their type:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Session cookies: deleted when you close your browser</li>
          <li className="hero-policies__list-item">Persistent cookies: remain for a set period or until you delete them</li>
        </ul>

        <h2 className="hero-policies__subtitle">6. Changes to This Policy</h2>
        <p className="hero-policies__description">
          We may update this Cookie Policy from time to time. Material changes will be communicated via a notice on our website or via email.
        </p>

        <h2 className="hero-policies__subtitle">7. Contact Us</h2>
        <p className="hero-policies__description">
          If you have questions or concerns about how we use cookies, please contact us at:
        </p>
        <p className="hero-policies__description">
          email: <a href="mailto:privacy@theplanbeyond.com">privacy@theplanbeyond.com</a>
        </p>
      </div>
    </div>
  );
};

export default Cookie;
import React from 'react';
import './Policy.css';

const TermsCondition = () => {
  return (
    <div className="hero-policies">
      <div className="hero-policies__background">
        <div className="hero-policies__overlay">
          <div className="hero-policies__content">
            <h1 className="hero-policies__title">Terms and Conditions</h1>
          </div>
        </div>
      </div>
      <div className="hero-policies__text-section">
        <p className="hero-policies__description">
          Effective Date: May 05, 2025
        </p>
        <p className="hero-policies__description">
          Please read these Terms and Conditions ("Terms") carefully before using our website, mobile applications, and services (collectively, the “Platform”).
        </p>
        <p className="hero-policies__description">
          By accessing or using TPB, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
        </p>

        <h2 className="hero-policies__subtitle">1. Eligibility</h2>
        <p className="hero-policies__description">
          You must be at least 18 years of age and legally capable of entering into binding contracts to use this Platform. By creating an account, you confirm you meet these criteria.
        </p>

        <h2 className="hero-policies__subtitle">2. Account Registration</h2>
        <p className="hero-policies__description">
          To access certain features, you are required to register and create an account. You agree to provide accurate, current, and complete information and to update this information as needed.
        </p>
        <p className="hero-policies__description">
          You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
        </p>

        <h2 className="hero-policies__subtitle">3. Services Provided</h2>
        <p className="hero-policies__description">
          TPB allows users to:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Store and manage documents, passwords, memories, and final wishes</li>
          <li className="hero-policies__list-item">Designate Ambassadors or Nominees to handle data post-death</li>
          <li className="hero-policies__list-item">Schedule posthumous messages</li>
          <li className="hero-policies__list-item">Use legacy planning tools like memory tagging, subscriptions tracking, and reward transfers</li>
          <li className="hero-policies__list-item">Download or export data via secure USB options</li>
        </ul>
        <p className="hero-policies__description">
          TPB does not provide legal, medical, or financial advice. We may integrate with third-party service providers for such services, but we are not liable for their performance.
        </p>

        <h2 className="hero-policies__subtitle">4. Payment and Subscription</h2>
        <p className="hero-policies__description">
          We offer both free and paid subscription plans.
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Monthly and Yearly Plans: Users can choose between monthly or discounted yearly billing.</li>
          <li className="hero-policies__list-item">Free Trial: A 7-day trial may be offered, during which no payment is required.</li>
          <li className="hero-policies__list-item">Cancellation: You may cancel anytime via your dashboard. Yearly plan cancellations are eligible for partial refund for the unused period, upon request by your Nominee or Ambassador.</li>
          <li className="hero-policies__list-item">No Refunds for Monthly Plans: Unless legally required, we do not offer refunds on monthly subscriptions.</li>
        </ul>

        <h2 className="hero-policies__subtitle">5. Data Ownership and Access</h2>
        <p className="hero-policies__description">
          You retain ownership of all content and data uploaded to your account. TPB acts as a secure custodian.
        </p>
        <p className="hero-policies__description">
          Posthumous access to your data is controlled by your appointed Ambassadors and subject to dual-authentication protocols. TPB reserves the right to verify death notifications before unlocking any sensitive data.
        </p>

        <h2 className="hero-policies__subtitle">6. Termination</h2>
        <p className="hero-policies__description">
          You may delete your account at any time. TPB also reserves the right to suspend or terminate your account if:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">You violate these Terms</li>
          <li className="hero-policies__list-item">You engage in fraudulent or abusive behavior</li>
          <li className="hero-policies__list-item">Required by law or governmental request</li>
        </ul>

        <h2 className="hero-policies__subtitle">7. Limitation of Liability</h2>
        <p className="hero-policies__description">
          To the maximum extent permitted by law, TPB, its officers, employees, and affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from:
        </p>
        <ul className="hero-policies__list">
          <li className="hero-policies__list-item">Use or inability to use the platform</li>
          <li className="hero-policies__list-item">Unauthorized access to your data</li>
          <li className="hero-policies__list-item">Errors, inaccuracies, or data loss beyond our control</li>
        </ul>
        <p className="hero-policies__description">
          Our total liability will not exceed the amount paid by you for the service in the preceding 12 months.
        </p>

        <h2 className="hero-policies__subtitle">8. Privacy</h2>
        <p className="hero-policies__description">
          Your privacy is important to us. Please refer to our <a href="/privacy-policy">Privacy Policy</a> to understand how we collect, use, and protect your data.
        </p>

        <h2 className="hero-policies__subtitle">9. Modifications</h2>
        <p className="hero-policies__description">
          TPB reserves the right to modify these Terms at any time. If material changes are made, we will notify you via email or dashboard notification. Continued use of the Platform constitutes your acceptance of the revised Terms.
        </p>

        <h2 className="hero-policies__subtitle">10. Governing Law</h2>
        <p className="hero-policies__description">
          These Terms are governed by the laws of India. Any legal action or proceeding arising under these Terms shall be brought in the courts of India.
        </p>

        <h2 className="hero-policies__subtitle">11. Contact</h2>
        <p className="hero-policies__description">
          If you have questions or concerns, please contact us at:
        </p>
        <p className="hero-policies__description">
          email: <a href="mailto:support@theplanbeyond.com">support@theplanbeyond.com</a>
        </p>
      </div>
    </div>
  );
};

export default TermsCondition;
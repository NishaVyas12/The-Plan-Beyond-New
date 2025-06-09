import React from 'react';
import './Policy.css';
import FAQSection from './FAQSection';


const HelpCenter = () => {
  return (
    <div className="hero-policies">
      <div className="help-policies__background">
        <div className="hero-policies__overlay">
          <div className="hero-policies__content">
            <h1 className="hero-policies__title">Help Center</h1>
          </div>
        </div>
      </div>
      <div className="hero-policies__text-section">
        <p className="hero-policies__description">
          Welcome to the Help Center for The Plan Beyond (TPB) — your guide to protecting what matters, even when you’re no longer around.
        </p>
        <p className="hero-policies__description">
          Have questions? We’ve grouped the most commonly asked ones into categories to help you find answers quickly.
        </p>

        <h2 className="hero-policies__subtitle">Getting Started</h2>
        <h3 className="hero-policies__questions">1. What is The Plan Beyond (TPB)?</h3>
        <p className="hero-policies__description">
          TPB is a secure legacy planning platform that allows you to store, manage, and pass on memories, messages, passwords, documents, and final wishes to your loved ones in the event of your passing.
        </p>
        <h3 className="hero-policies__questions">2. Why should I use TPB?</h3>
        <p className="hero-policies__description">
          In cases of sudden illness or unexpected death, families are often left with unanswered questions, missing documents, and locked accounts. TPB helps you organize and secure everything important so your family isn’t left searching or guessing.
        </p>
        <h3 className="hero-policies__questions">3. Who should I assign as my Ambassador(s)?</h3>
        <p className="hero-policies__description">
          Ambassadors are trusted individuals you appoint to handle and approve access to your data after you’re gone. Choose people who are responsible, trustworthy, and emotionally capable of making decisions on your behalf.
        </p>
        <h3 className="hero-policies__questions">4. How do I invite an Ambassador?</h3>
        <p className="hero-policies__description">
          You can invite them by email or phone during account setup. Once they accept the invitation, they’ll create a free TPB account with limited access rights as defined by you.
        </p>

        <h2 className="hero-policies__subtitle" style={{ marginTop: '3rem' }}>Security & Privacy</h2>
        <h3 className="hero-policies__questions">1. Is my data safe with TPB?</h3>
        <p className="hero-policies__description">
          Yes. We use AES-256 bit encryption for stored data, SSL/TLS protocols for transmission, and multi-factor authentication for login. Your information is protected using industry-leading security standards.
        </p>
        <h3 className="hero-policies__questions">2. Who can access my data after I’m gone?</h3>
        <p className="hero-policies__description">
          Only your appointed Ambassadors. They must authenticate using dual-verification to unlock your dashboard after your passing. Access to sensitive data is granted only after a short delay and approval sequence.
        </p>
        <h3 className="hero-policies__questions">3. Can I download my data offline?</h3>
        <p className="hero-policies__description">
          Yes. TPB allows you to download your data onto an encrypted USB or drive. Opening this file requires a dynamic password provided at the time of download.
        </p>
        <h3 className="hero-policies__questions">4. Do you share my data with anyone?</h3>
        <p className="hero-policies__description">
          No. TPB does not sell, rent, or share your data with third parties. You remain the sole owner of your information.
        </p>

        <h2 className="hero-policies__subtitle" style={{ marginTop: '3rem' }}>Platform Features</h2>
        <h3 className="hero-policies__questions">1. What types of information can I store?</h3>
        <p className="hero-policies__description">
          You can store personal documents, financial data, digital account logins, scheduled messages, final wishes, photo memories, and instructions for Ambassadors.
        </p>
        <h3 className="hero-policies__questions">2. What is Memory Tagging?</h3>
        <p className="hero-policies__description">
          This feature allows you to upload photos and tag them with names, places, and dates — triggering powerful memories for loved ones when they see them later.
        </p>
        <h3 className="hero-policies__questions">3. Can I assign different Ambassadors for different tasks?</h3>
        <p className="hero-policies__description">
          Yes. For example, one Ambassador can manage your digital assets, while another handles subscription cancellations or reward point transfers.
        </p>
        <h3 className="hero-policies__questions">4. Can I leave personalized messages for people?</h3>
        <p className="hero-policies__description">
          Absolutely. You can create scheduled or posthumous messages (emails, texts, or videos) that will be sent to selected individuals when triggered.
        </p>

        <h2 className="hero-policies__subtitle" style={{ marginTop: '3rem' }}>After-Death Process</h2>
        <h3 className="hero-policies__questions">1. What happens when I pass away?</h3>
        <p className="hero-policies__description">
          Your Ambassadors must confirm your passing using a dual-authentication process. Once verified, your dashboard is locked. Only your memorial board remains open for messages and tributes.
        </p>
        <h3 className="hero-policies__questions">2. How are my subscriptions and rewards handled?</h3>
        <p className="hero-policies__description">
          You can assign Ambassadors to cancel services or apply for refunds on unused portions. TPB helps generate pre-filled emails or forms to simplify this process.
        </p>
        <h3 className="hero-policies__questions">3. Can someone view my memories after I'm gone?</h3>
        <p className="hero-policies__description">
          Yes, but only if you’ve assigned them as recipients. They’ll receive a temporary password valid for a limited time to view/download specific content.
        </p>
        <h3 className="hero-policies__questions">4. What if my Ambassador doesn’t act?</h3>
        <p className="hero-policies__description">
          You can assign a backup Ambassador or Nominee. If no one acts, your information remains securely locked until proper verification is received.
        </p>

        <h2 className="hero-policies__subtitle" style={{ marginTop: '3rem' }}>Plans & Billing</h2>
        <h3 className="hero-policies__questions">1. Do you offer a free trial?</h3>
        <p className="hero-policies__description">
          Yes. We offer a 7-day free trial with no credit card required.
        </p>
        <h3 className="hero-policies__questions">2. What plans are available?</h3>
        <p className="hero-policies__description">
          We have both monthly and yearly plans. Yearly plans come with added benefits like free USB backup, priority support, and message scheduling.
        </p>
        <h3 className="hero-policies__questions">3. Can I cancel anytime?</h3>
        <p className="hero-policies__description">
          Yes. You can cancel at any point. If you cancel mid-year, your Ambassador or Nominee can request a refund for the unused portion.
        </p>
        <h3 className="hero-policies__questions">4. What happens to my data if I cancel my plan?</h3>
        <p className="hero-policies__description">
          If you cancel, your account remains active until the end of your term. After that, your data is securely deleted unless otherwise specified by your nominee.
        </p>
        <h3 className="hero-policies__questions">5. What if I pass away during my active yearly plan?</h3>
        <p className="hero-policies__description">
          If you pass away during a yearly subscription, your Ambassador or Nominee can request a refund for the remaining unused months of your plan. They can choose to continue or cancel the service, and we will retain the data securely until the plan term ends or they request deletion.
        </p>
        <FAQSection />
      </div>
    </div>
  );
};

export default HelpCenter;
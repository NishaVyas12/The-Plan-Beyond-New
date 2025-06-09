import React from 'react';
import './AboutMatter.css';

const AboutMatter = () => {
  return (
    <div className="about_matter-container">
      <h1 className="about_matter-title">What Matters <span style={{ color: 'var(--primary-color)' }}>MOST</span></h1>
      <p className="about_matter-subtitle">
      At The Plan Beyond, we believe every life holds meaning — and every goodbye should be handled with clarity, not confusion.
      </p>
      <p className="about_matter-description">
      From passwords to personal messages, from legal documents to digital assets, our mission is simple: to protect what matters most, so no family is left overwhelmed or unprepared.
      </p>
    </div>
  );
};

export default AboutMatter;
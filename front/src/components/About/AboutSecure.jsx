import React from 'react';
import './AboutSecure.css';
import secureFormImg from '../../assets/images/Aboutpage/secure.png'; // Placeholder image path

const AboutSecure = () => {
  return (
    <div className="about_secure-container">
      <div className="about_secure-content">
        <div className="about_secure-text-section">
          <h1 className="about_secure-title">Secure Document <br /><span style={{ color: 'var(--primary-color)' }}>Storage</span></h1>
          <p className="about_secure-description">
            Safely store IDs, wills, insurance policies, and more.
          </p>
          <ul className="about_secure-list">
            <li className="about_secure-list-item">Military-grade encryption</li>
            <li className="about_secure-list-item">Ambassador roles for trust-based access</li>
            <li className="about_secure-list-item">Memory tagging for photo-driven storytelling</li>
            <li className="about_secure-list-item">Scheduled messages & farewell boards</li>
            <li className="about_secure-list-item">Legal/insurance partner integrations</li>
            <li className="about_secure-list-item">Dynamic USB backups & funeral planning tools</li>
          </ul>
        </div>
        <div className="about_secure-image-section">
          <img src={secureFormImg} alt="IDs and Vital Documentation" className="about_secure-image" />
        </div>
      </div>
    </div>
  );
};

export default AboutSecure;
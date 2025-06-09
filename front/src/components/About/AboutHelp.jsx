import React from 'react';
import './AboutHelp.css';
import organizationImg from '../../assets/images/Aboutpage/organization.png';
import guidanceImg from '../../assets/images/Aboutpage/guidance.png';
import sharingImg from '../../assets/images/Aboutpage/sharing.png';

const AboutHelp = () => {
  return (
    <div className="about_help-container">
      <h1 className="about_help-title">How We Can <span style={{ color: 'var(--primary-color)' }}>Help</span></h1>
      <div className="about_help-content">
        <div className="about_help-item">
          <img src={organizationImg} alt="Organization illustration" className="about_help-image" />
          <h2 className="about_help-subtitle">Organization</h2>
          <p className="about_help-description">
          Store everything from your will to your Wi-Fi password — securely and in one place.
          </p>
        </div>
        <div className="about_help-item">
          <img src={guidanceImg} alt="Guidance illustration" className="about_help-image" />
          <h2 className="about_help-subtitle">Guidance</h2>
          <p className="about_help-description">
          Step-by-step support to ensure nothing is left undone.
          </p>
        </div>
        <div className="about_help-item">
          <img src={sharingImg} alt="Sharing illustration" className="about_help-image" />
          <h2 className="about_help-subtitle">Sharing</h2>
          <p className="about_help-description">
          Custom permissions and nominee access, so the right people get the right information at the right time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutHelp;
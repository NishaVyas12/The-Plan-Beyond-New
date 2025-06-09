import React from 'react';
import './AboutProtection.css';
import protectionImg from '../../assets/images/Aboutpage/protection.png';
import arrowIcon from '../../assets/images/icons/arrow.svg'; 

const AboutProtection = () => {
  const handleSetUpClick = () => {
    window.location.href = "/register";
  };

  return (
    <div className="about_protection-container">
      <div className="about_protection-content">
        <div className="about_protection-image-section">
          <img src={protectionImg} alt="Protection illustration" className="about_protection-image" />
        </div>
        <div className="about_protection-text-section">
          <h1 className="about_protection-title">One Solution For Full <br /><span style={{ color: 'var(--primary-color)' }}>Protection</span></h1>
          <p className="about_protection-description">
          The Plan Beyond brings all your essential information into one secure dashboard — accessible anytime, from anywhere.
          </p>
          <p className="about_protection-description about_protection-description-second">
          With features like document uploads, nominee roles, and dynamic access control, your legacy is protected and preserved exactly as you want it to be.
          </p>
          <button className="about_protection-button" onClick={handleSetUpClick}>
            Set up for free
            <img src={arrowIcon} alt="Arrow icon" className="about_protection-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutProtection;
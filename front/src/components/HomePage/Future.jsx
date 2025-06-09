import React from "react";
import "./Future.css";
import secureIcon from "../../assets/images/icons/icon7.svg";
import digitalIcon from "../../assets/images/icons/icon8.svg";
import memorialIcon from "../../assets/images/icons/icon9.svg";
import securityImage from "../../assets/images/Homepage/security-graphic.png";
import arrowImage from "../../assets/images/icons/arrow.svg";
import tickImage from "../../assets/images/icons/tick.svg";

const Future = () => {
  const handleSubscribeClick = () => {
    window.location.href = "/pricing";
  };

  return (
    <div className="future-container">
      <h1 className="future-title">
        This is where The Plan Beyond <span className="future-title-highlight">Changes Everything</span>
      </h1>
      <div className="future-card-section">
        <div className="future-card">
          <div className="future-icon">
            <img src={secureIcon} alt="Secure Legacy Vault" />
          </div>
          <h2 className="future-card-title">Secure Legacy Vault</h2>
          <p className="future-card-text">
            Store and protect everything that matters—your personal messages, passwords, and even your final wishes.
          </p>
          <ul className="future-card-list">
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              End-to-End Encryption for Data Protection
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Secure Access Protocols
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Privacy-First Data Policies
            </li>
          </ul>
        </div>
        <div className="future-card">
          <div className="future-icon">
            <img src={digitalIcon} alt="Digital Asset Management" />
          </div>
          <h2 className="future-card-title">Asset Management</h2>
          <p className="future-card-text">
            Manage and pass on your digital life with ease, including social media accounts, digital photos, and online subscriptions.
          </p>
          <ul className="future-card-list">
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Control Your Digital Footprint
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Secure and Easy Access for Loved Ones
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Organized access to social account
            </li>
          </ul>
        </div>
        <div className="future-card">
          <div className="future-icon">
            <img src={memorialIcon} alt="Memorial Timeline" />
          </div>
          <h2 className="future-card-title">Memorial Timeline</h2>
          <p className="future-card-text">
            Curate a timeline of your life—a story told by you, not an obituary written in grief.
          </p>
          <ul className="future-card-list">
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Immediate SMS notifications
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              Comprehensive email updates
            </li>
            <li className="future-card-list-item">
              <img src={tickImage} alt="Tick" className="future-tick-image" />
              International contact support
            </li>
          </ul>
        </div>
      </div>
      <div className="future-banner">
        <div className="future-security-section">
          <div className="future-security-content">
            <h2 className="future-security-title">Security You Can Trust</h2>
            <p className="future-security-text">
              At The Plan Beyond, we prioritize your security with{" "}
              <span style={{ color: "#007c6a", fontWeight: "bold" }}>
                Military-Grade Encryption
              </span>{" "}
              to protect your sensitive data. Our strict privacy protocols ensure that only your trusted nominees have access to your information, keeping it safe from unauthorized access. Rest easy knowing that your legacy is securely stored and shared only with whom you choose.
            </p>
            <button className="future-subscribe-button" onClick={handleSubscribeClick}>
              Subscribe Now <span className="future-button-arrow"><img src={arrowImage} alt="Arrow" /></span>
            </button>
          </div>
          <div className="future-security-image">
            <img src={securityImage} alt="Security Graphic" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Future;
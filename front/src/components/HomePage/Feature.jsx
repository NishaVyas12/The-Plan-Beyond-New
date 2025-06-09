import React from "react";
import "./Feature.css";
import photoIcon from "../../assets/images/icons/icon10.svg";
import videoIcon from "../../assets/images/icons/icon11.svg";
import nomineeIcon from "../../assets/images/icons/icon13.svg";

const Feature = () => {
  return (
    <div className="additional_feature-container">
      <div className="additional_feature-content">
        <h1 className="additional_feature-title">
          <span className="additional_feature-title-black">
            Enhanced Features for a
          </span>
          <span className="additional_feature-title-blue"> Secure Plan</span>
        </h1>
        <p className="additional_feature-subtitle">
          Gain Access to the Features That Empower You with Complete Control,
          Unmatched Peace of Mind, and the Highest Level of Security
        </p>
        <div className="additional_feature-features">
          <div className="additional_feature-feature">
            <div className="additional_feature-icon-wrapper">
              <img
                src={photoIcon}
                alt="Photo Archive"
                className="additional_feature-icon"
              />
            </div>
            <h2 className="additional_feature-heading">
              Military-Grade Encryption
            </h2>
            <p className="additional_feature-description">
              Your personal information is protected by industry leading
              encryption standards, ensuring your sensitive data is secure from
              unauthorized access.
            </p>
          </div>
          <div className="additional_feature-feature">
            <div className="additional_feature-icon-wrapper">
              <img
                src={videoIcon}
                alt="Video Messages"
                className="additional_feature-icon"
              />
            </div>
            <h2 className="additional_feature-heading">
              Multi-Step Authentication
            </h2>
            <p className="additional_feature-description">
              The Plan Beyond uses layered verification like passwords,
              biometrics, & secure codes to ensure only you can access or change
              your sensitive information.
            </p>
          </div>
          <div className="additional_feature-feature">
            <div className="additional_feature-icon-wrapper">
              <img
                src={nomineeIcon}
                alt="Nominee Management"
                className="additional_feature-icon"
              />
            </div>
            <h2 className="additional_feature-heading">Customizable Access</h2>
            <p className="additional_feature-description">
              Designate specific people for different tasks whether it's
              handling your will, passwords, or farewell messages ensuring your
              legacy is delivered exactly as intended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feature;

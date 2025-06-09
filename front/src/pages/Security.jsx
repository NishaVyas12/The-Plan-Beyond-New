import React from "react";
import "./Security.css";
import dataEncryptionImage from "../assets/images/Security/encrypt.png";
import Infrastructure from "../assets/images/Security/infrastructure.png";
import Control from "../assets/images/Security/control.png";
import Storage from "../assets/images/Security/storage.png";
import Audits from "../assets/images/Security/audits.png";
import Compliance from "../assets/images/Security/compliance.png";
import Authentication from "../assets/images/Security/authentication.png"
const Security = () => {
  return (
    <div className="security">
      <div className="security__background">
        <div className="security__overlay">
          <div className="security__content">
            <h1 className="security__title">Security</h1>
          </div>
        </div>
      </div>
      <div className="security__text-section">
        <h2 className="security__subtitle">
          Discover Nice<span style={{ color: "#007c6a" }}> Articles HERE</span>
        </h2>
        <p className="security__description">
          At The Plan Beyond, safeguarding your personal information is our top
          priority. We understand the sensitivity of the data you <br />
          entrust to us—ranging from personal memories to critical documents—and
          we’ve implemented robust security measures <br />
          to ensure its protection.
        </p>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Data <span style={{ color: "#007c6a" }}>Encryption</span>
            </h3>
            <p className="security__encryption-description">
              In Transit: All communications between your device and our servers
              are encrypted using 256-bit SSL/TLS protocols, ensuring that data
              transmitted is secure from interception.
            </p>
            <p className="security__encryption-description">
              At Rest: Your data is stored using Advanced Encryption Standard
              (AES) 256-bit encryption, a standard adopted by governments and
              financial institutions for securing sensitive information.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={dataEncryptionImage}
              alt="Data Encryption Shield"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Secure <span style={{ color: "#007c6a" }}>Infrastructure</span>
            </h3>
            <p className="security__encryption-description">
              Cloud Hosting: We utilize Amazon Web Services (AWS) for our cloud
              infrastructure, benefiting from their state-of-the-art security
              measures and compliance certifications.
            </p>
            <p className="security__encryption-description">
              Data Segmentation: Inspired by Industry practices, we implement
              data segmentation strategies to ensure that even in the unlikely
              event of unauthorized access, your complete data remains
              protected.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Infrastructure}
              alt="Secure Infrastructure"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Access <span style={{ color: "#007c6a" }}>Controls</span>
            </h3>
            <p className="security__encryption-description">
              Role-Based Access: TPB employs a dual-role system:
            </p>
            <p className="security__encryption-description">
              Inputter Ambassador: Initiates actions and inputs data.
            </p>
            <p className="security__encryption-description">
              Approver Ambassador: Confirms and approves actions initiated by
              the Inputter.
            </p>
            <p className="security__encryption-description">
              This two-step verification ensures that no single individual has
              unilateral access to sensitive information.
            </p>
            <p className="security__encryption-description">
              Multi-Factor Authentication (MFA): Users and ambassadors are
              required to verify their identity through MFA, adding an extra
              layer of security to account access.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Control}
              alt="Access Control"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Data Handling & <span style={{ color: "#007c6a" }}>Storage</span>
            </h3>
            <p className="security__encryption-description">
              Daily Backups: We perform daily backups of all data, storing them
              in multiple secure locations to prevent data loss.
            </p>
            <p className="security__encryption-description">
              Offline Access: For added security, users can download their data
              onto encrypted USB drives. Accessing this data requires dynamic
              passwords, ensuring that even offline data remains protected.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Storage}
              alt="Data Handling & Storage"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Regular Security <span style={{ color: "#007c6a" }}>Audits</span>
            </h3>
            <p className="security__encryption-description">
              We conduct regular security audits and vulnerability assessments
              to identify and rectify potential security gaps. Our commitment to
              continuous improvement ensures that our security measures evolve
              with emerging threats.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Audits}
              alt="Regular Security Audits"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Data Privacy & 
              <span style={{ color: "#007c6a" }}> Compliance</span>
            </h3>
            <p className="security__encryption-description">
              No Data Sharing: TPB does not sell or share your data with third
              parties. Your information is used solely for the services you opt
              into.
            </p>
            <p className="security__encryption-description">
              Compliance: We adhere to global data protection regulations,
              including GDPR, HIPAA, and SOC 2, ensuring that your data is
              handled with the utmost care and legal compliance.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Compliance}
              alt="Data Privacy Compliance"
              className="security__encryption-image"
            />
          </div>
        </div>
        <div className="security__encryption-section">
          <div className="security__encryption-text">
            <h3 className="security__encryption-title">
              Multi-Step
              <span style={{ color: "#007c6a" }}> Authentication</span>
            </h3>
            <p className="security__encryption-description">
              The Plan Beyond uses layered verification—like passwords,
              biometrics, and secure codes—to ensure only you can access or
              change your most sensitive information.
            </p>
          </div>
          <div className="security__encryption-image-container">
            <img
              src={Authentication}
              alt="Multi-Step Authentication"
              className="security__encryption-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;

import React from "react";
import "./Process.css";
import Process1 from "../../assets/images/Homepage/process1.png";
import Process2 from "../../assets/images/Homepage/process2.png";
import Process3 from "../../assets/images/Homepage/process3.svg";
import Process4 from "../../assets/images/Homepage/process4.png";
import Process5 from "../../assets/images/Homepage/process5.png";

const ProcessSteps = () => {
  return (
    <div className="container">
      <div className="process-wrapper">
        <h2 className="process-heading">
          How <span className="process-highlight">The Plan Beyond</span> Works
        </h2>
        <p className="process-subtext">
          Our simple 5-step process ensures your loved ones stay connected and
          receive the support they need when you're no longer able to provide
          it.
        </p>
        <div className="process-steps">
          <svg
            width="1172"
            height="1640"
            viewBox="0 0 1172 1640"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M513.5 70H31C14.4315 70 1 83.4315 1 100V340C1 356.569 14.4314 370 31 370H877"
              stroke="#007C6A"
            />
            <path
              d="M215.995 670H31C14.4315 670 1 683.431 1 700V940C1 956.569 14.4315 970 31 970H511"
              stroke="#007C6A"
            />
            <path
              d="M215.995 1270H31C14.4315 1270 1 1283.43 1 1300V1540C1 1556.57 14.4315 1570 31 1570H511"
              stroke="#007C6A"
            />
            <path
              d="M688.686 370H1141C1157.57 370 1171 383.431 1171 400V640C1171 656.569 1157.57 670 1141 670H94"
              stroke="#007C6A"
            />
            <path
              d="M478.686 970H1141C1157.57 970 1171 983.431 1171 1000V1240C1171 1256.57 1157.57 1270 1141 1270H94"
              stroke="#007C6A"
            />
            <path
              d="M676 0V40C676 56.5685 662.569 70 646 70H501"
              stroke="#007C6A"
            />
            <path
              d="M674 1640V1600C674 1583.43 660.569 1570 644 1570H499"
              stroke="#007C6A"
            />
            <circle
              cx="1082"
              cy="370"
              r="14.5"
              fill="#F5FFFE"
              stroke="#007C6A"
              stroke-dasharray="2 2"
            />
            <circle cx="1082" cy="370" r="8" fill="#007C6A" />
            <circle
              cx="1082"
              cy="970"
              r="14.5"
              fill="#F5FFFE"
              stroke="#007C6A"
              stroke-dasharray="2 2"
            />
            <circle cx="1082" cy="970" r="8" fill="#007C6A" />
            <circle
              cx="90"
              cy="670"
              r="14.5"
              fill="#F5FFFE"
              stroke="#007C6A"
              stroke-dasharray="2 2"
            />
            <circle cx="90" cy="670" r="8" fill="#007C6A" />
            <circle
              cx="90"
              cy="70"
              r="14.5"
              fill="#F5FFFE"
              stroke="#007C6A"
              stroke-dasharray="2 2"
            />
            <circle cx="90" cy="70" r="8" fill="#007C6A" />
            <circle
              cx="90"
              cy="1272"
              r="14.5"
              fill="#F5FFFE"
              stroke="#007C6A"
              stroke-dasharray="2 2"
            />
            <circle cx="90" cy="1272" r="8" fill="#007C6A" />
          </svg>

          <div className="process-step step1">
            <div className="process-content">
              <div className="process-text">
                <span className="step-label">STEP 1</span>
                <h3>Setup Your Profile</h3>
                <p>
                  Create your account, complete your profile, and select up to 2
                  trusted <br />
                  nominees who will act on your behalf when needed
                </p>
              </div>
              <img
                src={Process1}
                alt="Setup Your Profile"
                className="process-image process-image-step1"
              />
            </div>
          </div>

          <div className="process-step step2 reverse">
            <div className="process-content">
              <div className="process-text">
                <span className="step-label">STEP 2</span>
                <h3>Add Your Connections</h3>
                <p>
                  Easily add the contact information for family, friends, and
                  others who <br />
                  should be notified
                </p>
              </div>
              <img
                src={Process2}
                alt="Add Your Connections"
                className="process-image process-image-step2"
              />
            </div>
          </div>

          <div className="process-step step3">
            <div className="process-content">
              <div className="process-text">
                <span className="step-label">STEP 3</span>
                <h3>Nominee Access and Notification</h3>
                <p>
                  When the time comes, your nominees will have secure access to
                  your <br />
                  account and can initiate notifications to your family and
                  friends
                </p>
              </div>
              <img
                src={Process3}
                alt="Nominee Access and Notification"
                className="process-image process-image-step3"
              />
            </div>
          </div>

          <div className="process-step step4 reverse">
            <div className="process-content">
              <div className="process-text">
                <span className="step-label">STEP 4</span>
                <h3>Add Information to Your Vault</h3>
                <p>
                  Securely upload your wishes, passwords, and final messages —
                  including voice notes and videos that keep your presence
                  alive, even when you’re not.
                </p>
              </div>
              <img
                src={Process4}
                alt="Add Information to Your Vault"
                className="process-image process-image-step4"
              />
            </div>
          </div>

          <div className="process-step step5">
            <div className="process-content">
              <div className="process-text">
                <span className="step-label">STEP 5</span>
                <h3>Legacy Activation</h3>
                <p>
                  When you're gone, your ambassadors will trigger custom
                  notifications and share <br />
                  your messages with loved ones.
                </p>
              </div>
              <img
                src={Process5}
                alt="Legacy Activation"
                className="process-image process-image-step5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSteps;

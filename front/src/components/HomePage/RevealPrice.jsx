import React from "react";
import "./RevealPrice.css";
import arrowIcon from "../../assets/images/icons/green_arrow.svg";

const RevealPrice = () => {
  const handleSubscribeClick = () => {
    window.location.href = "/pricing";
  };

  return (
    <div className="revealprice-container">
      <div className="revealprice-card">
        <h1 className="revealprice-title">
          Legacy Planning at{" "}
          <span style={{ color: "#007c6a" }}>Affordable Price</span>
        </h1>
        <p className="revealprice-description">
          The Plan Beyond's simple, transparent pricing gives you the peace of
          mind that your legacy is secure, and your important messages will<br />
          reach the right people at the right time.
        </p>
        <button className="revealprice-button" onClick={handleSubscribeClick}>
          Subscribe Now
          <img src={arrowIcon} alt="Arrow" className="arrow-icon" />
        </button>
      </div>
    </div>
  );
};

export default RevealPrice;
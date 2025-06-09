import React from "react";
import "./AboutJoin.css";
import arrowIcon from "../../assets/images/icons/arrow.svg";

const AboutJoin = () => {
  const handleSubscribeClick = () => {
    window.location.href = "/pricing";
  };

  return (
    <div className="about_join-new-container">
      <div className="about_join-join-section">
        <h2 className="about_join-join-title">Join <span style={{ color: "#007c6a" }}>The Plan Beyond </span><br />Before life decides for you</h2>
        <button className="about_join-join-button" onClick={handleSubscribeClick}>
          Subscribe Now
          <img src={arrowIcon} alt="Arrow" className="about_join-join-arrow" />
        </button>
      </div>
    </div>
  );
};

export default AboutJoin;
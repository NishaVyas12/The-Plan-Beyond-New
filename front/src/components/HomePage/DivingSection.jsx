import React from "react";
import "./DivingSection.css";
import arrowIcon from "../../assets/images/icons/arrow.svg";

const DivingSection = () => {
  const handleCardClick = (blogRoute) => {
    window.location.href = blogRoute;
  };

  return (
    <div className="diving-section">
      <h2 className="diving-heading">
        Diving More Into <span style={{ color: "#007c6a" }}>The Plan Beyond</span>
      </h2>
      <div className="diving-cards-container">
        <div className="diving-card" onClick={() => handleCardClick("/blog3")} style={{ cursor: "pointer" }}>
          <h3 className="diving-card-title">
            Best Tools for <br />End-of-Life Planning in the <br />Digital Age
          </h3>
          <div className="diving-card-footer">
            <span className="diving-card-date">27 Jan • 8 min</span>
            <img src={arrowIcon} alt="Arrow" className="diving-arrow-icon" />
          </div>
        </div>
        <div className="diving-card" onClick={() => handleCardClick("/blog2")} style={{ cursor: "pointer" }}>
          <h3 className="diving-card-title">
            How to Leave a<br />Last Message for Your Loved <br />Ones Digitally
          </h3>
          <div className="diving-card-footer">
            <span className="diving-card-date">27 Jan • 8 min</span>
            <img src={arrowIcon} alt="Arrow" className="diving-arrow-icon" />
          </div>
        </div>
        <div className="diving-card" onClick={() => handleCardClick("/blog1")} style={{ cursor: "pointer" }}>
          <h3 className="diving-card-title">
            Why You Should Think <br />About Your Digital Legacy <br />Today
          </h3>
          <div className="diving-card-footer">
            <span className="diving-card-date">27 Jan • 8 min</span>
            <img src={arrowIcon} alt="Arrow" className="diving-arrow-icon" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivingSection;
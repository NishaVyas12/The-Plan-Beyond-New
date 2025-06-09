import React from "react";
import "./HeroSection.css";
import Dashboard from "../../assets/images/Homepage/dashboard.png";
import ArrowIcon from "../../assets/images/icons/arrow.svg"; 
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleSubscribeClick = () => {
    navigate("/pricing");
  };

  return (
    <div className="hero-container">
      <section className="hero-hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-hero-content">
          <h1>
            Don’t leave your legacy to chance
            <br />
            <span style={{ color: "#007c6a" }}> make it count.</span>
          </h1>
          <p>
            The Plan Beyond lets you plan for the future beyond a will, ensuring
            your wishes, messages, and assets are<br /> shared with the right people
            at the right time - providing your loved ones with comfort, clarity,
            and support when they <br />need it most.
          </p>
          <button className="hero-demo-btn" onClick={handleSubscribeClick}>
            Subscribe Now
            <img src={ArrowIcon} alt="Arrow" className="hero-demo-arrow" />
          </button>
        </div>
      </section>

      <section className="hero-dashboard-image-section">
        <img
          src={Dashboard}
          alt="Dashboard Preview"
          className="hero-dashboard-image"
        />
      </section>
    </div>
  );
};

export default HeroSection;
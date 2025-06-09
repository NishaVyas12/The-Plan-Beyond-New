import React from "react";
import "./AboutWhoWeAre.css";
import whoweare from "../../assets/images/Aboutpage/whowe.png";

const AboutWhoWeAre = () => {
  return (
    <div className="about_who_we_are-container">
      <div className="about_who_we_are-text-section">
        <h1 className="about_who_we_are-title">
          Who <span style={{ color: "var(--primary-color)" }}>We Are</span>
        </h1>
        <p className="about_who_we_are-description">
          We’re a team of technologists and empathy-first designers on a mission
          to make death a little less difficult.
        </p>
        <p className="about_who_we_are-description">
          Backed by cybersecurity veterans and empathetic advisors, we blend
          secure systems with soft touches — helping you organize the hard stuff
          so your loved ones can focus on healing, not hunting for paperwork.
        </p>
       
      </div>
      <div className="about_who_we_are-image-section">
        <img
          src={whoweare}
          alt="Hands together"
          className="about_who_we_are-image"
        />
      </div>
    </div>
  );
};

export default AboutWhoWeAre;

import React from "react";
import "./AboutMission.css";

const AboutMission = () => {
  return (
    <div className="about_mission-container">
      <h1 className="about_mission-title">
        The People Behind{" "}
        <span style={{ color: "var(--primary-color)" }}>Our Mission</span>
      </h1>
      <p className="about_mission-description">
        The Plan Beyond was born from witnessing the heartbreak of what happens
        after.
        <br />
        Families left searching for documents. Struggling to access accounts.
        Unsure how to honor final wishes. We knew there had to be a better way
      </p>
      <p className="about_mission-description">
      So we built a platform where everything — from legal records to life stories — could be stored safely, and passed on gracefully.
      </p>
    </div>
  );
};

export default AboutMission;

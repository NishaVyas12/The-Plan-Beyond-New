import React from 'react';
import './AboutHero.css';
import placeholderImage from '../../assets/images/Aboutpage/hero.png';

const AboutHero = () => {
  return (
    <div className="about-hero-container">
      <div className="about-hero-image-section">
        <img src={placeholderImage} alt="Family in park" className="about-hero-image" />
      </div>
      <div className="about-hero-text-section">
        <h1 className="about-hero-title">About <span style={{ color: 'var(--primary-color)' }}>The Plan Beyond</span></h1>
        <p className="about-hero-description">
        We empower people to live better lives, secure in the knowledge that their legacy won’t be lost in the chaos of unprepared goodbyes.
        <br /><br/>Because memories, wishes, and important details deserve 
more    than panic — they deserve a plan.
        </p>
      </div>
    </div>
  );
};

export default AboutHero;
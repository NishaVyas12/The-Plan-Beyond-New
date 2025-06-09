import React from 'react';
import './HeroHowItWorks.css';
import arrowIcon from '../../assets/images/icons/arrow.svg'; 

const HeroHowItWorks = () => {
  const handleBookDemoClick = () => {
    window.location.href = "/contact-us";
  };

  return (
    <div className="hero-how-it-works">
      <h2 className="hero-how-it-works__title">
        How <span style={{ color: 'var(--primary-color)' }}>The Plan Beyond Works</span>
      </h2>
      <p className="hero-how-it-works__description">
      Set your legacy in motion with a secure, step-by-step process that puts you in full control,<br /> ensuring your information is protected, your wishes are honoured, and your loved ones are supported.
      </p>
      <button className="hero-how-it-works__button" onClick={handleBookDemoClick}>
        Book A Demo
        <img src={arrowIcon} alt="Arrow" className="hero-how-it-works__button-icon" />
      </button>
    </div>
  );
};

export default HeroHowItWorks;
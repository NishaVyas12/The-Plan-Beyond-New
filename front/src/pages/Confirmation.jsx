import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Confirmation.css';
import Confirmation from "../assets/images/dash_icon/confirmation.png"

const ThankYou = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="confirmation-page-container">
      <div className="confirmation-card">
        <div className="confirmation-tick-container">
          <img src={Confirmation} alt="Checkmark" className="confirmation-tick" />
        </div>
        <h2 className="confirmation-title">
         Thank You!<br />You are a part of a legacy now!
        </h2>
        <p className="confirmation-message">
          You’ve been entrusted with a meaningful role as an ambassador of The Plan Beyond.
        </p>
      </div>
    </div>
  );
};

export default ThankYou;
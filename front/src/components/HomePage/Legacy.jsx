import React from 'react';
import './Legacy.css';
import Icon1 from '../../assets/images/icons/icon1.svg';
import Icon2 from '../../assets/images/icons/icon2.svg';
import Icon3 from '../../assets/images/icons/icon3.svg';
import Icon4 from '../../assets/images/icons/icon4.svg';
import Icon5 from '../../assets/images/icons/icon5.svg';
import Icon6 from '../../assets/images/icons/icon6.svg';


const Legacy = () => {
  return (
    <section className="legacy-section-container">
      <div className="legacy-section-content">
        <h1 className="legacy-section-title">
        The Brutal Truth of Leaving a Legacy <span className="legacy-section-title-blue">Unplanned</span>
        </h1>
        <p className="legacy-section-subtitle">
        Don’t let your story fade away. It’s time to face the harsh realities of not planning ahead.
        </p>
        <div className="legacy-section-grid">
          <div className="legacy-section-card legacy-section-card-1">
            <div className="legacy-section-icon">
              <img src={Icon1} alt="Nominee Icon" />
            </div>
            <h2 className="legacy-section-card-title">Unspoken Wishes</h2>
            <p className="legacy-section-card-description">
            Without clear instructions, your loved ones could be left
            guessing and stressed during a difficult time.
            </p>
          </div>
          <div className="legacy-section-card legacy-section-card-2">
            <div className="legacy-section-icon">
              <img src={Icon2} alt="Notification Icon" />
            </div>
            <h2 className="legacy-section-card-title">Unprepared Spouses</h2>
            <p className="legacy-section-card-description">
            Even the closest relationships can be overwhelmed by
            the complexity of final arrangements.
            </p>
          </div>
          <div className="legacy-section-card legacy-section-card-3">
            <div className="legacy-section-icon">
              <img src={Icon3} alt="Media Icon" />
            </div>
            <h2 className="legacy-section-card-title">Burdened Children</h2>
            <p className="legacy-section-card-description">
            Leaving your children to navigate chaos & uncertainty
            robs them of their time to grieve.
            </p>
          </div>
          <div className="legacy-section-card legacy-section-card-4">
            <div className="legacy-section-icon">
              <img src={Icon4} alt="Funeral Icon" />
            </div>
            <h2 className="legacy-section-card-title">Regret of Inaction</h2>
            <p className="legacy-section-card-description">
            Failing to plan often means important things are left
            unsaid, causing lasting regret.
            </p>
          </div>
          <div className="legacy-section-card legacy-section-card-5">
            <div className="legacy-section-icon">
              <img src={Icon5} alt="Flower Icon" />
            </div>
            <h2 className="legacy-section-card-title">Lost Legacies</h2>
            <p className="legacy-section-card-description">
            Without a plan, your story, values, and memories might
            never be fully shared or remembered.
            </p>
          </div>
          <div className="legacy-section-card legacy-section-card-6">
            <div className="legacy-section-icon">
              <img src={Icon6} alt="Security Icon" />
            </div>
            <h2 className="legacy-section-card-title">Tomorrow isn’t Guaranteed</h2>
            <p className="legacy-section-card-description">
            We all assume we have more time, but life doesn’t
            always give us that luxury.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Legacy;
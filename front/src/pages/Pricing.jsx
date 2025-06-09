import React from 'react';
import './Pricing.css';
import crossIcon from '../assets/images/icons/cross.svg'; 
import tickIcon from '../assets/images/icons/tick.svg'; 
import FAQSection from '../components/Policies/FAQSection';
const Pricing = () => {
  return (
    <div className="pricing-detail">
      <div className="pricing-detail__header">
        <h1 className="pricing-detail__title">Choose <span style={{ color: "#007c6a" }}>The Plan Beyond</span></h1>
        <p className="pricing-detail__description">
          Start your journey with essential tools to safeguard your documents and digital memories.
        </p>
      </div>
      <div className="pricing-detail__cards">
        <div className="pricing-detail__card pricing-detail__card--free">
          <h3 className="pricing-detail__card-title">Free Account</h3>
          <div className="pricing-detail__card-underline"></div>
          <p className="pricing-detail__card-price">₹ 0 - 15 Days</p>
          <button className="pricing-detail__card-button pricing-detail__card-button--dark">Get Started</button>
        </div>
        <div className="pricing-detail__card">
          <h3 className="pricing-detail__card-title">Standard Plan</h3>
          <div className="pricing-detail__card-underline"></div>
          <p className="pricing-detail__card-price">₹ 4,999 <span className="pricing-detail__card-billing">/year Billed Annually</span></p>
          <button className="pricing-detail__card-button">Get Started</button>
        </div>
        <div className="pricing-detail__card">
          <h3 className="pricing-detail__card-title">Advanced Plan</h3>
          <div className="pricing-detail__card-underline"></div>
          <p className="pricing-detail__card-price">₹ 9,999 <span className="pricing-detail__card-billing">/year Billed Annually</span></p>
          <button className="pricing-detail__card-button">Get Started</button>
        </div>
        <div className="pricing-detail__card">
          <h3 className="pricing-detail__card-title">Legacy Pro Plan</h3>
          <div className="pricing-detail__card-underline"></div>
          <p className="pricing-detail__card-price">₹ 19,999 <span className="pricing-detail__card-billing">/year Billed Annually</span></p>
          <button className="pricing-detail__card-button">Get Started</button>
        </div>
      </div>
      <div className="pricing-detail__feature-comparison">
        <h2 className="pricing-detail__feature-title">Feature Comparison</h2>
        <table className="pricing-detail__feature-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Free</th>
              <th>Standard</th>
              <th>Advanced</th>
              <th>Legacy Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pricing-detail__feature-category pricing-detail__feature-category--dark">Usage Duration</td>
              <td>Days</td>
              <td>Yearly</td>
              <td>Yearly</td>
              <td>Yearly</td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Unlimited Document</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Uploads</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">File Uploads</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Attachment Storage</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td>5 GB</td>
              <td>10 GB</td>
              <td>20 GB</td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category pricing-detail__feature-category--section pricing-detail__feature-category--features pricing-detail__feature-category--dark">Features</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Scheduled Message</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Delivery</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Photo/Video Tagging</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Nominee Access</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Custom Templates</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category pricing-detail__feature-category--smart-reminders">Smart Reminders</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category pricing-detail__feature-category--section pricing-detail__feature-category--security pricing-detail__feature-category--dark">Security</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">End-to-End Encryption</td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Role-Based Nominee</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">Permissions</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
            <tr>
              <td className="pricing-detail__feature-category">USB Backup Access</td>
              <td><img src={crossIcon} alt="Cross" className="pricing-detail__feature-icon pricing-detail__feature-icon--cross" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
              <td><img src={tickIcon} alt="Tick" className="pricing-detail__feature-icon pricing-detail__feature-icon--check" /></td>
            </tr>
          </tbody>
        </table>
        <FAQSection />
      </div>
    </div>
  );
};

export default Pricing;
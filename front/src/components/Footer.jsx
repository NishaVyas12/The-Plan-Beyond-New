import React from 'react';
import './Footer.css';
import instagramIcon from '../assets/images/icons/insta.svg';
import twitterIcon from '../assets/images/icons/twitter.svg';
import facebookIcon from '../assets/images/icons/fb.svg';
import phoneIcon from '../assets/images/icons/phone.svg';
import mailIcon from '../assets/images/icons/mail.svg';
import locationIcon from '../assets/images/icons/location.svg';
import logoIcon from "../assets/images/icons/logo.svg";

const Footer = () => {
  return (
    <div className="footer-container">
      <div className="footer-content">
        <div className="footer-section footer-first-section">
          <img src={logoIcon} alt="The Plan Beyond Logo" className="footer-logo" />
          <p className="footer-description">
            Ensuring your final wishes are respected and your loved ones are supported during their time of need.
          </p>
          <div className="footer-social">
            <img src={instagramIcon} alt="Instagram" className="footer-social-icon" />
            <img src={twitterIcon} alt="Twitter" className="footer-social-icon" />
            <img src={facebookIcon} alt="Facebook" className="footer-social-icon" />
          </div>
        </div>
        <div className="footer-grouped-sections">
          <div className="footer-section">
            <h2 className="footer-title">Quick Link</h2>
            <ul className="footer-links">
              <li className="footer-link" onClick={() => window.location.href = "/about"} style={{ cursor: "pointer" }}>About</li>
              <li className="footer-link" onClick={() => window.location.href = "/how-it-works"} style={{ cursor: "pointer" }}>How it Works</li>
              <li className="footer-link" onClick={() => window.location.href = "/help-center"} style={{ cursor: "pointer" }}>Help Center</li>
              <li className="footer-link" onClick={() => window.location.href = "/blogs"} style={{ cursor: "pointer" }}>Blogs</li>
              <li className="footer-link" onClick={() => window.location.href = "/pricing"} style={{ cursor: "pointer" }}>Pricing</li>
              <li className="footer-link" onClick={() => window.location.href = "/security"} style={{ cursor: "pointer" }}>Security</li>
              <li className="footer-link" onClick={() => window.location.href = "/contact-us"} style={{ cursor: "pointer" }}>Contact Us</li>
            </ul>
          </div>
          <div className="footer-section">
            <h2 className="footer-title">Contact</h2>
            <p className="footer-contact-info">
              <img src={phoneIcon} alt="Phone" className="footer-contact-icon" /> (800) 555-0123
            </p>
            <p className="footer-contact-info">
              <img src={mailIcon} alt="Mail" className="footer-contact-icon" /> support@planbeyond.com
            </p>
            <p className="footer-contact-info">
              <img src={locationIcon} alt="Location" className="footer-contact-icon" />Vatika Business Park, Sector 49<br />Gurgoan, 122018
            </p>
          </div>
          <div className="footer-section">
            <h2 className="footer-title">Subscribe to our newsletter</h2>
            <p className="footer-description-subscribe">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <div className="footer-subscribe">
              <input type="text" className="footer-input" placeholder="Enter your email..." />
              <button className="footer-button">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-links-bottom">
          <span className="footer-link-bottom">©2025 Copyright all rights are reserved</span>
          <span className="footer-link-bottom">|</span>
          <span className="footer-link-bottom">All Rights Reserved</span>
          <span className="footer-link-bottom">|</span>
          <span className="footer-link-bottom" onClick={() => window.location.href = "/privacy-policy"} style={{ cursor: "pointer" }}>Privacy policy</span>
          <span className="footer-link-bottom">|</span>
          <span className="footer-link-bottom" onClick={() => window.location.href = "/terms-and-condition"} style={{ cursor: "pointer" }}>Terms of service</span>
          <span className="footer-link-bottom">|</span>
          <span className="footer-link-bottom" onClick={() => window.location.href = "/cookie"} style={{ cursor: "pointer" }}>Cookies</span>
        </div>
      </div>
    </div>
  );
};

export default Footer;
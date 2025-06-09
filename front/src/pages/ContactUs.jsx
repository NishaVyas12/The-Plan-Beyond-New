import React from 'react';
import './ContactUs.css';
import phoneIcon from '../assets/images/Contact/phone.svg';
import whatsappIcon from '../assets/images/Contact/whatsapp.svg';
import emailIcon from '../assets/images/Contact/mail.svg';
import locationIcon from '../assets/images/Contact/location.svg';
import arrowIcon from '../assets/images/icons/arrow.svg';

const ContactUs = () => {
  return (
    <div>
      <div className="contact-us-first-container">
        <div className="contact-us">Contact Us</div>
      </div>
      <div className="contact-us-container">
        <div className="contact-us-left">
          <div className="contact-us-touch">Get in touch</div>
          <div className="contact-us-description">
          We're here when you need us — whether it’s a question, a concern, or a conversation that just can’t wait.
          Reach out. We’re listening.
          </div>
          <div className="contact-us-icon">
            <div className="contact-us-icon-round">
              <img src={phoneIcon} alt="Phone" className="contact-us-icon-size" />
            </div>
            <div className="contact-us-description">+91 9216519700</div>
          </div>
          <div className="contact-us-icon">
            <div className="contact-us-icon-round">
              <img src={whatsappIcon} alt="WhatsApp" className="contact-us-icon-size" />
            </div>
            <div className="contact-us-description">+91 8968290116</div>
          </div>
          <div className="contact-us-icon">
            <div className="contact-us-icon-round">
              <img src={emailIcon} alt="Email" className="contact-us-icon-size" />
            </div>
            <div className="contact-us-description">Info@theplanbeyond.com</div>
          </div>
          <div className="contact-us-icon">
            <div className="contact-us-icon-round">
              <img src={locationIcon} alt="Location" className="contact-us-icon-size" />
            </div>
            <div className="contact-us-description">
            Vatika Business Park, Sector 49 <br /> Gurgaon, 122018
            </div>
          </div>
        </div>

        <div className="contact-us-right">
          <div className="contact-us-form-row">
            <div className="contact-us-form-column">
              <div><label className="contact-us-label-field">First Name</label></div>
              <div><input type="text" className="contact-us-input-field" /></div>
            </div>
            <div className="contact-us-form-column">
              <div><label className="contact-us-label-field">Last Name</label></div>
              <div><input type="text" className="contact-us-input-field" /></div>
            </div>
          </div>

          <div className="contact-us-form-row">
            <div className="contact-us-form-column">
              <div><label className="contact-us-label-field">Email</label></div>
              <div><input type="text" className="contact-us-input-field" /></div>
            </div>
            <div className="contact-us-form-column">
              <div><label className="contact-us-label-field">Phone Number</label></div>
              <div><input type="text" className="contact-us-input-field" /></div>
            </div>
          </div>
          <div className="contact-us-form-column">
            <div><label className="contact-us-label-field">Your Message</label></div>
            <div><textarea className="contact-us-textarea" rows="10" cols="50"></textarea></div>
          </div>
          <div>
            <button className="contact-us-submit">
              Submit
              <img src={arrowIcon} alt="Arrow" className="contact-us-arrow-icon" />
            </button>
          </div>
          <div className="contact-us-info">
          For information about how The Plan Beyond handles personal data see our Privcy Policy
          </div>
          <div className="contact-us-questionairre">
            <div className="contact-us-box">
              <div className="contact-us-textbox">Prefer Email?</div>
              <div className='contact-us-textbox-desc'>You can also reach us on this<br/>
              <span className="contact-us-green">contact@theplanbeyond.com</span></div>
            </div>
            <div className="contact-us-box">
              <div className="contact-us-textbox">Have Questions?</div>
              <div className='contact-us-textbox-desc'><span className="contact-us-green">Visit our Help Centre</span> and get answers to the most frequently asked questions.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
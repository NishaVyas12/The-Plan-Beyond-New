import React from "react";
import "./TestimonialSection.css";
import TestimonialImage from "../../assets/images/Homepage/family.png";
import { NavLink } from "react-router-dom";

const TestimonialSection = () => {

  return (
    <div className="trustpilot-container">
      <section className="trustpilot-testimonial-section">
        <div className="trustpilot-left-content">
          <h2 className="trustpilot-heading">
            Hear From People <br />
            Who’ve Planned Ahead with <br />
            <span style={{ color: "#007c6a" }}>The Plan Beyond</span>
          </h2>
          <div className="trustpilot-rating">
            <span className="trustpilot-star">★</span>
            <span className="trustpilot-star">★</span>
            <span className="trustpilot-star">★</span>
            <span className="trustpilot-star">★</span>
            <span className="trustpilot-star">★</span>
            <NavLink to="/reviews" className="trustpilot-read-reviews">
              Read Reviews
            </NavLink>
          </div>
        </div>
        <div className="trustpilot-right-content">
          <p className="trustpilot-quote">
            “I know how important it is to have everything in order, but The
            Plan Beyond goes way beyond just legal documents. It helps me keep
            my personal messages, passwords, and other important info secure and
            organized. The security it provides is top-notch, and that’s
            something I truly appreciate.”
          </p>
          <p className="trustpilot-author">Bob. 57 – Small Business Owner</p>
        </div>
      </section>
      <div className="trustpilot-image-section">
        <img
          src={TestimonialImage}
          alt="Family Planning Ahead"
          className="trustpilot-image"
        />
      </div>
    </div>
  );
};

export default TestimonialSection;

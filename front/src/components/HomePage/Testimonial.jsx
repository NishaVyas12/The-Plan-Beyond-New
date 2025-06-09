import React from "react";
import "./Testimonial.css";
import quoteIcon from "../../assets/images/icons/comma.svg";
import Client1 from "../../assets/images/Homepage/client1.png";
import Client2 from "../../assets/images/Homepage/client2.png";
import Client3 from "../../assets/images/Homepage/client3.png";

const Testimonial = () => {
  return (
    <div className="testimonial-container">
      <div className="testimonial-content">
        <h1 className="testimonial-title">
          <span className="testimonial-title-black">
            Because Trust Is the Legacy
          </span>
          <span className="testimonial-title-blue"> We Start With</span>
        </h1>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <img src={quoteIcon} alt="Quote" className="testimonial-quote" />
            <div className="testimonial-stars">
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
            </div>
            <p className="testimonial-text">
              As a lawyer, I know how important it is to have everything in
              order, but The Plan Beyond goes way beyond just legal documents.
              It helps me keep my personal messages, passwords, and other
              important info secure and organized.
            </p>
            <div className="testimonial-author">
              <img
                src={Client1}
                alt="Charles P."
                className="testimonial-author-image"
              />
              <div>
                <p className="testimonial-author-name">Geeta, 58</p>
                <p className="testimonial-author-role">
                  Corporate Paradigm Assistant
                </p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <img src={quoteIcon} alt="Quote" className="testimonial-quote" />
            <div className="testimonial-stars">
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
            </div>
            <p className="testimonial-text">
              I never thought I’d need something like The Plan Beyond, but it’s
              turned out to be exactly what I needed. It’s not just about having
              a will—it’s about making sure everything is organized in a way
              that takes the burden off my family.
            </p>
            <div className="testimonial-author">
              <img
                src={Client2}
                alt="David T."
                className="testimonial-author-image"
              />
              <div>
                <p className="testimonial-author-name">Pankaj, 80</p>
                <p className="testimonial-author-role">
                  Investor Operations Representative
                </p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <img src={quoteIcon} alt="Quote" className="testimonial-quote" />
            <div className="testimonial-stars">
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
              <span className="testimonial-star">★</span>
            </div>
            <p className="testimonial-text">
              What I love most about The Plan Beyond is how it allows me to plan
              ahead. I can decide who gets what and when—whether it’s a final
              message, personal documents, or instructions for my business.
            </p>
            <div className="testimonial-author">
              <img
                src={Client3}
                alt="Martha G."
                className="testimonial-author-image"
              />
              <div>
                <p className="testimonial-author-name">Rajiv, 65</p>
                <p className="testimonial-author-role">
                  Chief Implementation Specialist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
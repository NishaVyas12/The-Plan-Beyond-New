import React, { useState } from "react";
import "./Faq.css";
import chevronDown from "../../assets/images/icons/icon12.svg"; 
import chevronUp from "../../assets/images/icons/icon12.svg"; 
import arrowIcon from "../../assets/images/icons/arrow.svg"; 

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is The Plan Beyond and how does it work?",
      answer:
        "The Plan Beyond is a secure legacy planning platform that allows you to store personal information, assign ambassadors, and ensure your loved ones are notified after your passing. You can also assign who gets access to specific data like messages, passwords, or documents.",
    },
    {
      question: "What kind of information can I store on this platform?",
      answer:
        "You can store wills, passwords, property documents, social media account details, subscription information, banking info, personal messages, and more—securely.",
    },
    {
      question: "How does the platform know when I’ve passed away?",
      answer:
        "Your designated ambassadors can initiate the death notification process by verifying your passing through a secure, multi-authentication system.",
    },
    {
      question: "Is my data secure on The Plan Beyond?",
      answer:
        "Yes. The platform uses Military Grade end-to-end encryption, secure cloud storage, and dual-authentication access protocols to ensure your data is protected at all times.",
    },
    {
      question: "Can I decide who receives which information after my death?",
      answer:
        "Absolutely. You can assign different pieces of information to different people and control when and how they receive it.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSubscribeClick = () => {
    window.location.href = "/pricing";
  };

  return (
    <div className="faq-container">
      <div className="faq-content">
        <h1 className="faq-title">
          <span className="faq-title-black">Frequently Asked</span>
          <span className="faq-title-blue"> Questions</span>
        </h1>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              className={`faq-item ${openIndex === index ? "active" : ""}`}
              key={index}
            >
              <div className="faq-question" onClick={() => toggleFAQ(index)}>
                {faq.question}
                <span className="faq-toggle">
                  {openIndex === index ? (
                    <img src={chevronUp} alt="Chevron Up" className="faq-toggle-image" />
                  ) : (
                    <img src={chevronDown} alt="Chevron Down" className="faq-toggle-image" />
                  )}
                </span>
              </div>
              {openIndex === index && (
                <div className="faq-answer">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="faq-join-section">
        <h2 className="faq-join-title">Join <span style={{ color: "#007c6a" }}>The Plan Beyond </span><br />Before life decides for you</h2>
        <button className="faq-join-button" onClick={handleSubscribeClick}>
          Subscribe Now
          <img src={arrowIcon} alt="Arrow" className="faq-join-arrow" />
        </button>
      </div>
    </div>
  );
};

export default Faq;
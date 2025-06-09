import React, { useState } from "react";
import "./FAQSection.css";
import downArrow from "../../assets/images/icons/icon12.svg";

const FAQSection = () => {
  const [expanded, setExpanded] = useState(null);

  const toggleAnswer = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const faqs = [
    {
      question: "How does the nominee system work?",
      answer:
        "The Plan Beyond is a secure legacy planning platform that allows you to store personal information, assign ambassadors, and ensure your loved ones are notified after your passing. You can also assign who gets access to specific data like messages, passwords, or documents.",
    },
    {
      question:
        "What happens if I change my mind or want to update my information?",
      answer:
        "You can log in anytime to update, add, or remove any data, ambassadors, or recipient preferences.",
    },
    {
      question: "How much does it cost to use The Plan Beyond?",
      answer:
        "We offer different subscription plans starting at a one-time fee of Rs 4,999, depending on your storage needs and the features you select.",
    },
    {
      question: "Can my ambassadors access my data while I’m alive?",
      answer:
        "No. Your data remains locked and fully private until the system is triggered by a confirmed death verification process.",
    },
    {
      question: "Is this service legal and accepted worldwide?",
      answer:
        "The Plan Beyond complies with global data protection laws (like GDPR) and is a legal way to manage your personal digital legacy.",
    },
    {
      question: "What if I want to change my ambassador (nominee)?",
      answer:
        "You can update or replace your nominee anytime by logging into your dashboard. Changes are effective immediately and securely logged.",
    },
    {
      question:
        "Can I leave personalized messages, emails, or videos for my loved ones?",
      answer:
        "Yes. You can create and schedule messages, emails, or videos to be sent to specific people after your passing—on special dates, anniversaries, or as part of your final wishes. It’s a powerful way to stay connected, even after you're gone.",
    },
    {
      question:
        "Can I schedule messages or emails to be sent on specific future dates after my passing?",
      answer:
        "Yes. The Plan Beyond allows you to schedule messages, emails, or videos to be delivered on special dates such as birthdays, anniversaries, or important milestones—helping you stay present in your loved ones’ lives even after you're gone.",
    },
  ];

  return (
    <div className="help-center-faq-section">
      <div className="help-center-faq-section__left">
        <h2 className="help-center-faq-section__title">
          Frequently Asked <br />
          <span style={{ color: "#007c6a" }}>Questions</span>
        </h2>
        <p className="help-center-faq-section__description">
          For questions about billing, contact us at <br />
          <a href="mailto:support@planbeyond.com">
            <span style={{ color: "#007c6a" }}>support@planbeyond.com</span>
          </a>
        </p>
      </div>
      <div className="help-center-faq-section__right">
        {faqs.map((faq, index) => (
          <div key={index} className="help-center-faq-section__question">
            <div
              className="help-center-faq-section__question-header"
              onClick={() => toggleAnswer(index)}
            >
              <p className="help-center-faq-section__question-text">
                {faq.question}
              </p>
              <img
                src={downArrow}
                alt="Toggle Arrow"
                className={`help-center-faq-section__arrow ${
                  expanded === index
                    ? "help-center-faq-section__arrow--rotated"
                    : ""
                }`}
              />
            </div>
            {expanded === index && (
              <p className="help-center-faq-section__answer">{faq.answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;

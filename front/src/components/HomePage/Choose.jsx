import React, { useEffect, useRef } from "react";
import "./Choose.css";

const Choose = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const sectionNode = sectionRef.current; 

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = sectionNode.querySelectorAll(".choose-section-item");
            items.forEach((item) => {
              item.classList.remove("fade-in"); 
              void item.offsetWidth; 
              item.classList.add("fade-in"); 
            });
          }
        });
      },
      { threshold: 0.3 } 
    );

    if (sectionNode) {
      observer.observe(sectionNode);
    }

    return () => {
      if (sectionNode) {
        observer.unobserve(sectionNode); 
      }
    };
  }, []);

  return (
    <section className="choose-section-container" ref={sectionRef}>
      <div className="choose-section-content">
        <div className="choose-section-text">
          <h1 className="choose-section-title">
            Why Now? Because “Someday” is <span style={{ color: "#007c6a" }}>Not a Strategy</span>
          </h1>
          <div className="choose-section-items">
            <p className="choose-section-item choose-section-item-light-purple">
              You don’t plan your wedding on the day off
            </p>
            <p className="choose-section-item choose-section-item-light-pink">
              You don’t write your will on your deathbed
            </p>
            <p className="choose-section-item choose-section-item-light-green">
              Then why leave the most important closure of your life to chance?
            </p>
            <p className="choose-section-item choose-section-item-medium-pink">
              This isn’t morbid
            </p>
            <p className="choose-section-item choose-section-item-light-yellow">
              It’s clarity
            </p>
            <p className="choose-section-item choose-section-item-light-purple">
              It’s control
            </p>
            <p className="choose-section-item choose-section-item-light-green">
              It’s compassion
            </p>
            <p className="choose-section-item choose-section-item-light-pink">
              It’s a final act of love
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Choose;
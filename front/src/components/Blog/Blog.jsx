import React, { useState } from "react";
import "./Blog.css";
import articleImage1 from "../../assets/images/blog/blog1.jpg";
import articleImage2 from "../../assets/images/blog/blog2.jpg";
import articleImage3 from "../../assets/images/blog/blog3.jpg";
import articleImage4 from "../../assets/images/blog/blog4.jpg";
import articleImage5 from "../../assets/images/blog/blog5.jpg";
import rightArrow from "../../assets/images/icons/green_arrow.svg";

const Blog = () => {
  const [activeButton, setActiveButton] = useState("all-btn"); 

  const setActive = (buttonId) => {
    setActiveButton(buttonId);
  };

  return (
    <div className="blog-blog-section">
      <h1 className="blog-title">
        Discover NICE <span className="blog-green-color">Articles Here</span>
      </h1>
      <p className="blog-description">
        All the articles and contents of the site have been updated today, you
        can find your articles and <br />
        contents quickly and without any problems
      </p>
      <div className="blog-search-bar">
        <div className="blog-search-input">
          <span className="blog-search-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="20"
              height="20"
              viewBox="0 0 30 30"
            >
              <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"></path>
            </svg>
          </span>
          <input type="text" placeholder="Search here..." />
        </div>
        <div className="blog-categories">
          <button
            id="all-btn"
            className={`blog-category-btn ${
              activeButton === "all-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("all-btn")}
          >
            All
          </button>
          <button
            id="manufacturing-btn"
            className={`blog-category-btn ${
              activeButton === "manufacturing-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("manufacturing-btn")}
          >
            Manufacturing
          </button>
          <button
            id="technology-btn"
            className={`blog-category-btn ${
              activeButton === "technology-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("technology-btn")}
          >
            Technology
          </button>
          <button
            id="sports-btn"
            className={`blog-category-btn ${
              activeButton === "sports-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("sports-btn")}
          >
            Sports
          </button>
          <button
            id="design-btn"
            className={`blog-category-btn ${
              activeButton === "design-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("design-btn")}
          >
            Design
          </button>
          <button
            id="programming-btn"
            className={`blog-category-btn ${
              activeButton === "programming-btn" ? "blog-active" : ""
            }`}
            onClick={() => setActive("programming-btn")}
          >
            Programming
          </button>
        </div>
      </div>
      <div className="blog-articles-grid">
        <div className="blog-article-card">
          <div className="blog-article-image">
            <img src={articleImage1} alt="Article 1" />
          </div>
          <h3 className="blog-article-title">
            Why You Should Think About Your Digital Legacy Today
          </h3>
          <p className="blog-article-description">
            Life Leaves Traces. But Only If You Choose to Protect Them...
          </p>
          <a href="/blog1" className="blog-read-more">
            Read More{" "}
            <img
              src={rightArrow}
              alt="Right Arrow"
              className="blog-read-more-arrow"
            />
          </a>
        </div>
        <div className="blog-article-card">
          <div className="blog-article-image">
            <img src={articleImage2} alt="Article 2" />
          </div>
          <h3 className="blog-article-title">
            How to Leave a Last Message for Your Loved Ones Digitally
          </h3>
          <p className="blog-article-description">
            A true legacy isn't a legal form filled away. It's not a bank
            account or a will
          </p>
          <a href="/blog2" className="blog-read-more">
            Read More{" "}
            <img
              src={rightArrow}
              alt="Right Arrow"
              className="blog-read-more-arrow"
            />
          </a>
        </div>
        <div className="blog-article-card">
          <div className="blog-article-image">
            <img src={articleImage3} alt="Article 3" />
          </div>
          <h3 className="blog-article-title">
            Best Tools for End-of-Life Planning in the Digital Age
          </h3>
          <p className="blog-article-description">
            Every day spent waiting is another risk that your memories, your
            voice, your final wishes could be lost to silence.
          </p>
          <a href="/blog3" className="blog-read-more">
            Read More{" "}
            <img
              src={rightArrow}
              alt="Right Arrow"
              className="blog-read-more-arrow"
            />
          </a>
        </div>
        <div className="blog-article-card">
          <div className="blog-article-image">
            <img src={articleImage4} alt="Article 4" />
          </div>
          <h3 className="blog-article-title">
            5 Things Most People Forget to Do Before They Die (And Why It
            Matters)
          </h3>
          <p className="blog-article-description">
            A true legacy isn't a legal form filled away. It's not just a bank
            account or a will
          </p>
          <a href="/blog4" className="blog-read-more">
            Read More{" "}
            <img
              src={rightArrow}
              alt="Right Arrow"
              className="blog-read-more-arrow"
            />
          </a>
        </div>
        <div className="blog-article-card">
          <div className="blog-article-image">
            <img src={articleImage5} alt="Article 5" />
          </div>
          <h3 className="blog-article-title">
            How Seniors Can Stay in Touch Even After They’re Gone
          </h3>
          <p className="blog-article-description">
            We built The Plan Beyond because every life deserves a proper
            closing chapter one crafted with love, not confusion.
          </p>
          <a href="/blog5" className="blog-read-more">
            Read More{" "}
            <img
              src={rightArrow}
              alt="Right Arrow"
              className="blog-read-more-arrow"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Blog;
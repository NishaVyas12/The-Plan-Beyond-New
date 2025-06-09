import React from "react";
import "./Blog1.css";
import blogImage from "../../assets/images/blog/blog5.jpg";
import authorImage from "../../assets/images/blog/author.png";
import sidebarImage from "../../assets/images/blog/side-blog.png";
import bodyImage from "../../assets/images/blog/body-image.png";

const Blog5 = () => {
  return (
    <div className="detail_blog_container">
      <div className="detail_blog_content">
        <h1 className="detail_blog_title">
          How Seniors Can Stay in Touch Even After They’re Gone
        </h1>
        <div className="detail_blog_meta">
          <div className="detail_blog_meta_left">
            <button className="detail_blog_category">Technology</button>
            <span className="detail_blog_timestamp">12h ago</span>
          </div>
          <div className="detail_blog_author">
            <img
              src={authorImage}
              alt="Author"
              className="detail_blog_author_image"
            />
            <div className="detail_blog_author_info">
              <span className="detail_blog_author_name">
                Gregory Swaniawski
              </span>
              <span className="detail_blog_author_role">
                Human Tactile Agent
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="detail_blog_image_container">
        <img src={blogImage} alt="Blog" className="detail_blog_image" />
      </div>
      <div className="detail_blog_body_container">
        <div className="detail_blog_body_content">
          <h2 className="detail_blog_body_title">
            Love That Outlives Goodbye
          </h2>
          <p className="detail_blog_body_text">
            Aging brings reflection.
          </p>
          <p className="detail_blog_body_text">
            Reflection brings gratitude — and sometimes, fear.
          </p>
          <p className="detail_blog_body_text">
            The fear that when we go, our voices will fall silent too soon.
          </p>
          <p className="detail_blog_body_text">
            That the memories we built will fade faster than they deserve.
          </p>
          <p className="detail_blog_body_text">
            But today, technology offers a bridge across that final divide.
          </p>
          <p className="detail_blog_body_text">
            And The Plan Beyond is the architect.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Staying Connected After You’re Gone
          </h3>
          <p className="detail_blog_body_text">
            Imagine:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              A birthday letter arriving to your granddaughter, every year, even after you’re gone.
            </li>
            <li className="detail_blog_body_list_item">
              A wedding message waiting for your child, filled with love you never stopped feeling.
            </li>
            <li className="detail_blog_body_list_item">
              A memory timeline where your life story continues to guide and inspire.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            This is not fantasy.
          </p>
          <p className="detail_blog_body_text">
            This is what thoughtful planning makes possible.
          </p>

          <h3 className="detail_blog_body_subtitle">
            How Seniors Can Build Their Lasting Presence
          </h3>
          <p className="detail_blog_body_text">
            The Plan Beyond empowers seniors to:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              Record videos filled with stories, advice, laughter.
            </li>
            <li className="detail_blog_body_list_item">
              Write letters meant for specific days and milestones.
            </li>
            <li className="detail_blog_body_list_item">
              Secure memories in a vault that only trusted Ambassadors can unlock.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            It's not about clinging to life.
          </p>
          <p className="detail_blog_body_text">
            It's about making sure life’s most precious emotions are delivered when they matter most.
          </p>

          <h3 className="detail_blog_body_subtitle">
            The Gift You Leave Behind
          </h3>
          <p className="detail_blog_body_text">
            Your loved ones will always miss you.
          </p>
          <p className="detail_blog_body_text">
            But they will miss you differently if you leave them a trail of hope, laughter, and love to follow.
          </p>
          <p className="detail_blog_body_text">
            You can still be part of graduations, anniversaries, quiet rainy afternoons where someone just needs to feel you close again.
          </p>
          <p className="detail_blog_body_text">
            The Plan Beyond is how you stay in touch — with dignity, with grace, with heart.
          </p>
         

          <div className="detail_blog_body_image_container">
            <img
              src={bodyImage}
              alt="Body Image"
              className="detail_blog_body_image"
            />
          </div>
          <h2 className="detail_blog_body_final_title">
          👉 Create your enduring presence today — with The Plan Beyond.
          </h2>
          <p className="detail_blog_body_closing_text">
            Because your story deserves a proper ending.
          </p>
          <a href="/login" className="detail-login">
            <button className="detail_blog_body_join_button">
              Join Now
              <i className="fa-solid fa-arrow-right detail_blog_body_join_icon"></i>
            </button>
          </a>
        </div>
        <div className="detail_blog_body_sidebar">
          <img
            src={sidebarImage}
            alt="Sidebar Illustration"
            className="detail_blog_body_sidebar_image"
          />
          <h3 className="detail_blog_body_sidebar_title">
            Ready to Make Your Legacy Matter?
          </h3>
          <p className="detail_blog_body_sidebar_text">
            Your legacy isn’t just legal—it’s emotional.
          </p>
          <p className="detail_blog_body_sidebar_text">
            Your journey with The Plan Beyond — a digital vault for everything
            that matters.
          </p>
          <button className="detail_blog_body_subscribe_button">
            Subscribe Now
            <i className="fa-solid fa-arrow-right detail_blog_body_subscribe_icon"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Blog5;
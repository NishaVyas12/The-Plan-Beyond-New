import React from "react";
import "./Blog1.css";
import blogImage from "../../assets/images/blog/blog3.jpg";
import authorImage from "../../assets/images/blog/author.png";
import sidebarImage from "../../assets/images/blog/side-blog.png";
import bodyImage from "../../assets/images/blog/body-image.png";

const Blog3 = () => {
  return (
    <div className="detail_blog_container">
      <div className="detail_blog_content">
        <h1 className="detail_blog_title">
          Best Tools for End-of-Life Planning in the Digital Age
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
            Planning for Peace, Powered by Technology
          </h2>
          <p className="detail_blog_body_text">
            In an era where life unfolds across screens and devices, it is no surprise that even our final chapters now have a digital face.
          </p>
          <p className="detail_blog_body_text">
            End-of-life planning has moved beyond dusty wills and locked drawers.
          </p>
          <p className="detail_blog_body_text">
            Today, the tools we choose can make the difference between a confusing farewell and a graceful, guided goodbye.
          </p>
          <p className="detail_blog_body_text">
            The Plan Beyond is proud to lead this evolution — creating a space where love, clarity, and dignity meet technology.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Why Digital Tools Matter More Than Ever
          </h3>
          <p className="detail_blog_body_text">
            The modern world moves fast.
          </p>
          <p className="detail_blog_body_text">
            Passwords replace house keys. Memories live in cloud albums. Friendships span oceans through a click.
          </p>
          <p className="detail_blog_body_text">
            Without digital planning:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              Accounts linger, forgotten.
            </li>
            <li className="detail_blog_body_list_item">
              Messages go unsent.
            </li>
            <li className="detail_blog_body_list_item">
              Important farewells remain unspoken.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            The tools you use today determine how you are remembered tomorrow.
          </p>

          <h3 className="detail_blog_body_subtitle">
            The Tools That Truly Matter
          </h3>
          <p className="detail_blog_body_text">
            When choosing a digital legacy platform, look for three essentials:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              <strong>Security</strong>
              <p className="detail_blog_body_list_text">
                Your final wishes should be protected with encryption, nominee validation, and clear access protocols — not just left on a cloud folder.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Emotional Intelligence</strong>
              <p className="detail_blog_body_list_text">
                Tools should enable more than just logistics. They should carry your voice, your memories, and your love into the future.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Ease of Use</strong>
              <p className="detail_blog_body_list_text">
                The setup should be simple, dignified, and intuitive — because planning a legacy should empower, not overwhelm.
              </p>
            </li>
          </ul>
          <p className="detail_blog_body_text">
            At The Plan Beyond, we designed every feature with these pillars in mind.
          </p>

          <h3 className="detail_blog_body_subtitle">
            How The Plan Beyond Leads the Way
          </h3>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              Pre-Scheduled Messages — Sent at the right moment, to the right people, triggered by the ambassadors you trust.
            </li>
            <li className="detail_blog_body_list_item">
              Secure Memory Vault — Photos, letters, videos, and essential documents, locked safely for the future.
            </li>
            <li className="detail_blog_body_list_item">
              Ambassador Activation — Double-authenticated to ensure privacy, dignity, and timing.
            </li>
            <li className="detail_blog_body_list_item">
              Condolence Integration — Helping your loved ones send and receive support when it’s needed most.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            Unlike cold storage services or passive will vaults, The Plan Beyond is active, emotional, and built for the real world.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Because Goodbyes Should Never Be Left to Guesswork
          </h3>
          <p className="detail_blog_body_closing_text">
            You planned your life with care.<br />
            Now plan your goodbye with grace.<br />
            Because true legacy isn't about what you leave behind.<br />
            It's about how you make people feel when you are no longer there to say it.
          </p>
          

          <div className="detail_blog_body_image_container">
            <img
              src={bodyImage}
              alt="Body Image"
              className="detail_blog_body_image"
            />
          </div>
          <h2 className="detail_blog_body_final_title">
          👉 Start building your digital legacy today — with The Plan Beyond.
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

export default Blog3;
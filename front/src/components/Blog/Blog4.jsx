import React from "react";
import "./Blog1.css";
import blogImage from "../../assets/images/blog/blog4.jpg";
import authorImage from "../../assets/images/blog/author.png";
import sidebarImage from "../../assets/images/blog/side-blog.png";
import bodyImage from "../../assets/images/blog/body-image.png";

const Blog4 = () => {
  return (
    <div className="detail_blog_container">
      <div className="detail_blog_content">
        <h1 className="detail_blog_title">
          5 Things Most People Forget to Do Before They Die (And Why It Matters)
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
            The Forgotten Details That Leave the Loudest Silence
          </h2>
          <p className="detail_blog_body_text">Life is busy.</p>
          <p className="detail_blog_body_text">Death feels distant.</p>
          <p className="detail_blog_body_text">Until it isn’t.</p>
          <p className="detail_blog_body_text">
            And when the moment comes, it’s often the smallest unfinished tasks
            that cause the deepest regrets.
          </p>
          <p className="detail_blog_body_text">
            At The Plan Beyond, we help you see what most overlook — and act
            while you still can.
          </p>

          <h3 className="detail_blog_body_subtitle">What Most People Forget</h3>
          <ol className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              <strong>Leaving Personal Goodbyes</strong>
              <p className="detail_blog_body_list_text">
                Wills dictate assets.
              </p>
              <p className="detail_blog_body_list_text">
                But memories? Final words? Unspoken love?
              </p>
              <p className="detail_blog_body_list_text">
                They get lost unless you deliberately preserve them.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Organizing Digital Assets</strong>
              <p className="detail_blog_body_list_text">
                Without direction, accounts linger, subscriptions drain, and
                families scramble.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Naming the Right Ambassadors</strong>
              <p className="detail_blog_body_list_text">
                It's not about the nearest family.
              </p>
              <p className="detail_blog_body_list_text">
                It's about the most trusted hands to carry your final messages
                with care.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Sharing Emotional Wishes</strong>
              <p className="detail_blog_body_list_text">
                Favorite songs for your memorial.
              </p>
              <p className="detail_blog_body_list_text">
                Special letters for anniversaries.
              </p>
              <p className="detail_blog_body_list_text">
                These personal touches rarely get written down — until it's too
                late.
              </p>
            </li>
            <li className="detail_blog_body_list_item">
              <strong>Thanking the People Who Shaped You</strong>
              <p className="detail_blog_body_list_text">
                So many lives leave unspoken gratitude behind.
              </p>
              <p className="detail_blog_body_list_text">
                A simple thank-you letter can heal wounds and build bridges long
                after you are gone.
              </p>
            </li>
          </ol>

          <h3 className="detail_blog_body_subtitle">Why It Matters</h3>
          <p className="detail_blog_body_text">
            Your final imprint on this world should be intentional, not
            accidental.
          </p>
          <p className="detail_blog_body_text">
            When you don't prepare, you leave your loved ones to guess, argue,
            wonder — and often, grieve twice.
          </p>
          <p className="detail_blog_body_text">
            With The Plan Beyond, preparation becomes a final act of love.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Make Your Legacy One of Clarity, Not Chaos
          </h3>
          <p className="detail_blog_body_text">Craft messages.</p>
          <p className="detail_blog_body_text">Organize memories.</p>
          <p className="detail_blog_body_text">Choose your Ambassadors.</p>
          <p className="detail_blog_body_text">
            Because when the time comes, the last thing you want to leave behind
            is confusion.
          </p>

          <div className="detail_blog_body_image_container">
            <img
              src={bodyImage}
              alt="Body Image"
              className="detail_blog_body_image"
            />
          </div>
          <h2 className="detail_blog_body_final_title">
            👉 Plan your goodbye beautifully — with The Plan Beyond.
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

export default Blog4;

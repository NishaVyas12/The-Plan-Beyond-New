import React from "react";
import "./Blog1.css";
import blogImage from "../../assets/images/blog/blog2.jpg";
import authorImage from "../../assets/images/blog/author.png";
import sidebarImage from "../../assets/images/blog/side-blog.png";
import bodyImage from "../../assets/images/blog/body-image.png";

const Blog2 = () => {
  return (
    <div className="detail_blog_container">
      <div className="detail_blog_content">
        <h1 className="detail_blog_title">
        How to Leave a Last Message for Your Loved Ones — Digitally
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
          <h3 className="detail_blog_body_subtitle">
            The Final Words They’ll Never Forget
          </h3>
          <p className="detail_blog_body_text">
            In every life, there are words left unspoken.
          </p>
          <p className="detail_blog_body_text">
            A final thank you. A quiet apology. A simple, "I love you."
          </p>
          <p className="detail_blog_body_text">
            Often, these are the words that matter most — and too often, they are the first to be lost when we are gone.
          </p>
          <p className="detail_blog_body_text">
            Modern life gives us many ways to share fleeting moments, but few ways to preserve the ones that count.
          </p>
          <p className="detail_blog_body_text">
            The Plan Beyond was created to change that.
          </p>
          <p className="detail_blog_body_text">
            We believe your voice deserves to echo across time.
          </p>
          <p className="detail_blog_body_text">
            Your love, your wisdom, your gratitude — delivered exactly when it’s needed most, not when it's already too late.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Why Last Messages Matter
          </h3>
          <p className="detail_blog_body_text">
            When someone leaves without warning, families are left not only with grief but with questions.
          </p>
          <p className="detail_blog_body_text">
            Did they know they were loved? Did they have words left to say? Did they have wishes they could not express?
          </p>
          <p className="detail_blog_body_text">
            A last message can be the thread that holds together a family facing heartbreak.
          </p>
          <p className="detail_blog_body_text">
            It can be the voice that calms guilt.
          </p>
          <p className="detail_blog_body_text">
            It can be the memory that softens the pain.
          </p>
          <p className="detail_blog_body_text">
            And in a world where loss often arrives without preparation, the chance to say one last thing is not just meaningful — it’s priceless.
          </p>

          <h3 className="detail_blog_body_subtitle">
            How to Leave Your Final Messages — The Right Way
          </h3>
          <p className="detail_blog_body_text">
            At The Plan Beyond, we've reimagined what legacy communication should look like.
          </p>
          <p className="detail_blog_body_text">
            Simple. Secure. Unforgettable.
          </p>
          <p className="detail_blog_body_text">
            Here’s how you can prepare:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
            <strong>Write Messages:</strong> To family members, friends, even colleagues — anyone whose life you touched.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Record Personal Videos: </strong>A smile, a laugh, a familiar voice offering love and encouragement can become a priceless treasure.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Schedule Deliveries:</strong> Messages can be set for birthdays, anniversaries, milestones — allowing your presence to be felt even after you're gone.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            And most importantly:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              <strong>Assign Ambassadors: </strong>Trusted individuals who will safely activate your final wishes when the time comes.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            Every message is encrypted, every recipient carefully chosen, every moment preserved exactly the way you want it remembered.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Tomorrow Is a Risk You Don’t Have to Take
          </h3>
          <p className="detail_blog_body_text">
            We plan weddings.
          </p>
          <p className="detail_blog_body_text">
            We plan retirements.
          </p>
          <p className="detail_blog_body_text">
            We even plan vacations with obsessive detail.
          </p>
          <p className="detail_blog_body_text">
            Yet when it comes to the final goodbye — the one that could define everything we meant to those we love — we often leave it to chance.
          </p>
          <p className="detail_blog_body_text">
            Don’t.
          </p>
          <p className="detail_blog_body_text">
            Because life does not come with guarantees.
          </p>
          <p className="detail_blog_body_text">
            You have the power today to craft messages that will matter for a lifetime.
          </p>
          <p className="detail_blog_body_text">
            You have the ability to give your loved ones a final gift — a whisper of your soul that survives even the heaviest grief.
          </p>

          <h3 className="detail_blog_body_subtitle">
            The Plan Beyond: Where Love Has No Expiration Date
          </h3>
          <p className="detail_blog_body_text">
            This isn’t just a service.
          </p>
          <p className="detail_blog_body_text">
            It’s a promise.
          </p>
          <p className="detail_blog_body_text">
            A promise that when your voice is needed, it will be heard.
          </p>
          <p className="detail_blog_body_text">
            That when your story deserves telling, it will be told — by you, in your words, in your time.
          </p>
          <p className="detail_blog_body_text">
            Don't leave your final message to chance.
          </p>
          <p className="detail_blog_body_text">
            Create it today. While you can. Before the silence comes.
          </p>

          <div className="detail_blog_body_image_container">
            <img
              src={bodyImage}
              alt="Body Image"
              className="detail_blog_body_image"
            />
          </div>
          <h2 className="detail_blog_body_final_title">
          👉 Start your legacy with The Plan Beyond
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

export default Blog2;
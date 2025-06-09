import React from "react";
import "./Blog1.css";
import blogImage from "../../assets/images/blog/blog-image.png";
import authorImage from "../../assets/images/blog/author.png";
import sidebarImage from "../../assets/images/blog/side-blog.png";
import bodyImage from "../../assets/images/blog/body-image.png";

const Blog1 = () => {
  return (
    <div className="detail_blog_container">
      <div className="detail_blog_content">
        <h1 className="detail_blog_title">
          Why You Should Think About Your Digital Legacy Today
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
            The Plan Beyond — Because Your Story Deserves More Than Silence.
          </h2>
          <p className="detail_blog_body_text">
            Life Leaves Traces. But Only If You Choose to Protect Them.
          </p>
          <p className="detail_blog_body_text">You lived.</p>
          <p className="detail_blog_body_text">You loved.</p>
          <p className="detail_blog_body_text">
            You built moments that stretched beyond photographs and passing
            conversations.
          </p>
          <p className="detail_blog_body_text">
            But here’s the truth no one says aloud:
          </p>
          <h3 className="detail_blog_body_subtitle">Memories are fragile.</h3>
          <p className="detail_blog_body_text">
            Left unattended, they dissolve — swept away by time, by grief, by
            the quiet chaos that follows loss.
          </p>
          <p className="detail_blog_body_text">
            At The Plan Beyond, we believe your story deserves more. It deserves
            to be heard, remembered, honoured — exactly the way you intended.
          </p>
          {/* <p className="detail_blog_body_text">
            Friendships span oceans through a click.
          </p>
          <p className="detail_blog_body_text">
            Without digital planning:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">Accounts linger, forgotten.</li>
            <li className="detail_blog_body_list_item">Messages go unsent.</li>
            <li className="detail_blog_body_list_item">Important farewells remain unspoken.</li>
          </ul>
          <p className="detail_blog_body_text">
            The tools you use today determine how you are remembered tomorrow.
          </p> */}
          <h3 className="detail_blog_body_subtitle">
            The Problem We Never Talk About
          </h3>
          <p className="detail_blog_body_text">
            When a life ends, what follows is rarely graceful.
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              Families stumble in the dark, unsure who to call.
            </li>
            <li className="detail_blog_body_list_item">
              Friends who mattered are forgotten — not because they were
              unloved, but because no one knew.
            </li>
            <li className="detail_blog_body_list_item">
              Final wishes remain locked inside silent phones, dusty journals,
              half-finished messages never sent.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            You lived a lifetime gathering people, building connections,
            creating a tapestry of meaning.
          </p>
          <h3 className="detail_blog_body_subtitle">
            Digital Legacy: More Than Documents, It’s Dignity
          </h3>
          <p className="detail_blog_body_text">
            A true legacy isn’t a legal form filed away.
          </p>
          <p className="detail_blog_body_text">
            It’s not just a bank account or a will.
          </p>
          <p className="detail_blog_body_text">
            It’s the memory you leave behind, in the hearts and inboxes of those
            who mattered most.
          </p>
          <p className="detail_blog_body_text">
            It’s the goodbye you didn’t get to say.
          </p>
          <p className="detail_blog_body_text">
            It’s the reminder that your life was not just lived — it was loved,
            it was witnessed, it was felt.
          </p>
          <p className="detail_blog_body_text">
            At The Plan Beyond, we help you protect that legacy while you still
            can.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Why You Must Act Now — Not Later
          </h3>
          <p className="detail_blog_body_text">Someday is not a strategy.</p>
          <p className="detail_blog_body_text">Later is not a promise.</p>
          <p className="detail_blog_body_text">
            Every day spent waiting is another risk that your memories, your
            voice, your final wishes could be lost to silence.
          </p>
          <p className="detail_blog_body_text">Imagine:</p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
              A daughter who never hears your last encouragement.
            </li>
            <li className="detail_blog_body_list_item">
              A spouse left wondering what you would have wanted.
            </li>
            <li className="detail_blog_body_list_item">
              A best friend who learns too late that you thought of them until
              the very end.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            It doesn’t have to end this way.
          </p>
          <p className="detail_blog_body_text">
            You have the power to choose something better.
          </p>

          <h3 className="detail_blog_body_subtitle">
            The Plan Beyond: Your Last Message, Your Last Gift
          </h3>
          <p className="detail_blog_body_text">
            We built The Plan Beyond because every life deserves a proper
            closing chapter — one crafted with love, not confusion.
          </p>
          <p className="detail_blog_body_text">
            Here’s what we help you protect:
          </p>
          <ul className="detail_blog_body_list">
            <li className="detail_blog_body_list_item">
            <strong>Pre-written Messages:</strong> Sent exactly when they are needed most.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Memories and Photos: </strong>Preserved, tagged, and delivered with care.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Ambassador System: </strong>Trusted individuals who ensure your wishes are
              honored securely.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Digital Vault:</strong> Your essential information — safeguarded,
              encrypted, and shared only with those you trust.
            </li>
            <li className="detail_blog_body_list_item">
            <strong>Memorial Timeline:</strong> A curated story of your life — not written by
              grief, but by you.
            </li>
          </ul>
          <p className="detail_blog_body_text">
            Because when you're gone, the silence shouldn't be louder than your
            story.
          </p>

          <h3 className="detail_blog_body_subtitle">
            This Is About Love, Not Fear
          </h3>
          <p className="detail_blog_body_text">
            Planning your digital legacy is not about fearing death.
          </p>
          <p className="detail_blog_body_text">It’s about honouring life.</p>
          <p className="detail_blog_body_text">
            It’s about showing love one last time, without leaving a burden
            behind.
          </p>
          <p className="detail_blog_body_text">
            It’s about saying:
            <br />
            "You mattered to me."
            <br />
            "Here’s what I wanted for you."
            <br />
            "Here’s how you carry me forward."
          </p>
          <p className="detail_blog_body_text">That is not morbid.</p>
          <p className="detail_blog_body_text">
            That is the final, powerful act of compassion.
          </p>

          <h3 className="detail_blog_body_subtitle">
            Before the World Decides for You
          </h3>
          <p className="detail_blog_body_text">
            You spent your whole life building meaning, building bonds.
          </p>
          <p className="detail_blog_body_text">
            Don’t let the end erase the beginning.
          </p>
          <p className="detail_blog_body_text">
            Plan your legacy today.
            <br />
            Shape the way you are remembered.
            <br />
            Speak the words they will hold onto when they need you most.
          </p>
          <p className="detail_blog_body_text">
            Because love is louder than silence — but only if you choose to let
            it be heard.
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

export default Blog1;

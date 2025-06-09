import React from "react";
import "./StepHowItWorks.css";
import formImage from "../../assets/images/HowItWorks/step1_1.png";
import laptopImage from "../../assets/images/HowItWorks/step1_2.png";
import step2Image1 from "../../assets/images/HowItWorks/step2_2.png";
import step2Image2 from "../../assets/images/HowItWorks/step2_1.png";
import step3Image1 from "../../assets/images/HowItWorks/step3_2.png";
import step3Image2 from "../../assets/images/HowItWorks/step3_1.png";
import step4Image1 from "../../assets/images/HowItWorks/step4_2.png";
import step4Image2 from "../../assets/images/HowItWorks/step4_1.png";
import step5Image1 from "../../assets/images/HowItWorks/step5_2.png";
import step5Image2 from "../../assets/images/HowItWorks/step5_1.png";

const StepHowItWorks = () => {
  return (
    <div className="step-how-it-works">
      <div className="step-how-it-works__row">
        <div className="step-how-it-works__container">
          <div className="step-how-it-works__step">STEP 1</div>
          <h2 className="step-how-it-works__title">Create Your Profile</h2>
          <p className="step-how-it-works__description">
            Begin by setting up your secure profile. Enter key personal details
            and choose a master authentication method. This step forms the
            foundation of your plan, protected by military-grade encryption and
            multi-layer security to ensure your identity and data remain fully
            safeguarded.
          </p>
          {/* <ul className="step-how-it-works__list">
            <li className="step-how-it-works__list-item">
              Safely store IDs, wills, insurance policies, and more.
            </li>
            <li className="step-how-it-works__list-item">
              Access your documents anytime, anywhere, on any device
            </li>
            <li className="step-how-it-works__list-item">
              Enjoy peace of mind with advanced encryption & privacy controls.
            </li>
          </ul> */}
        </div>
        <div className="step-how-it-works__image-container step-how-it-works__image-right">
          <img
            src={formImage}
            alt="Signup Form"
            className="step-how-it-works__form-image"
          />
          <img
            src={laptopImage}
            alt="Laptop Background"
            className="step-how-it-works__background-image"
          />
        </div>
      </div>
      <div className="step-how-it-works__row">
        <div className="step-how-it-works__image-container step-how-it-works__image-left">
          <img
            src={step2Image1}
            alt="Step 2 Form"
            className="step-how-it-works__step2-image"
          />
          <img
            src={step2Image2}
            alt="Step 2 Background"
            className="step-how-it-works__step2-background-image"
          />
        </div>
        <div className="step-how-it-works__container">
          <div className="step-how-it-works__step">STEP 2</div>
          <h2 className="step-how-it-works__title">Add Your Contacts</h2>
          <p className="step-how-it-works__description">
            Select trusted individuals who will play a role in your
            plan—recipients, executors, or key holders. You decide who gets
            access to what and when. Whether it’s family members, legal
            representatives, or close friends, The Plan Beyond gives you
            complete flexibility in managing permissions and roles.
          </p>
          {/* <ul className="step-how-it-works__list">
            <li className="step-how-it-works__list-item">
              Safely store IDs, wills, insurance policies, and more.
            </li>
            <li className="step-how-it-works__list-item">
              Access your documents anytime, anywhere, on any device
            </li>
            <li className="step-how-it-works__list-item">
              Enjoy peace of mind with advanced encryption & privacy controls.
            </li>
          </ul> */}
        </div>
      </div>
      <div className="step-how-it-works__row">
        <div className="step-how-it-works__container">
          <div className="step-how-it-works__step">STEP 3</div>
          <h2 className="step-how-it-works__title">
            Review, Customize & Authenticate
          </h2>
          <p className="step-how-it-works__description">
            Carefully review your entries and assign permissions for each
            element of your plan. From passwords to private letters, you control
            visibility and access. Secure your settings using our multi-step
            authentication process, including biometric, password, and secondary
            verification layers. Every change is logged and verified, ensuring
            your plan remains tamper-proof and up to date.
          </p>
          {/* <ul className="step-how-it-works__list">
            <li className="step-how-it-works__list-item">
              Safely store IDs, wills, insurance policies, and more.
            </li>
            <li className="step-how-it-works__list-item">
              Access your documents anytime, anywhere, on any device
            </li>
            <li className="step-how-it-works__list-item">
              Enjoy peace of mind with advanced encryption & privacy controls.
            </li>
          </ul> */}
        </div>
        <div className="step-how-it-works__image-container step-how-it-works__image-right">
          <img
            src={step3Image1}
            alt="Step 3 Form"
            className="step-how-it-works__step3-image"
          />
          <img
            src={step3Image2}
            alt="Step 3 Background"
            className="step-how-it-works__step3-background-image"
          />
        </div>
      </div>
      <div className="step-how-it-works__row">
        <div className="step-how-it-works__image-container step-how-it-works__image-left">
          <img
            src={step4Image1}
            alt="Step 4 Form"
            className="step-how-it-works__step4-image"
          />
          <img
            src={step4Image2}
            alt="Step 4 Background"
            className="step-how-it-works__step4-background-image"
          />
        </div>
        <div className="step-how-it-works__container">
          <div className="step-how-it-works__step">STEP 4</div>
          <h2 className="step-how-it-works__title">
            Add Credentials & Key Information
          </h2>
          <p className="step-how-it-works__description">
            Securely upload and store the information that matters most. This
            includes digital credentials (like account logins and recovery
            keys), legal documents (wills, insurance, deeds), and critical
            instructions. All entries are encrypted and accessible only to the
            people you choose when you designate.
          </p>
          {/* <ul className="step-how-it-works__list">
            <li className="step-how-it-works__list-item">
              Safely store IDs, wills, insurance policies, and more.
            </li>
            <li className="step-how-it-works__list-item">
              Access your documents anytime, anywhere, on any device
            </li>
            <li className="step-how-it-works__list-item">
              Enjoy peace of mind with advanced encryption & privacy controls.
            </li>
          </ul> */}
        </div>
      </div>
      <div className="step-how-it-works__row">
        <div className="step-how-it-works__container">
          <div className="step-how-it-works__step">STEP 5</div>
          <h2 className="step-how-it-works__title">
            Leave Final Messages & Instructions
          </h2>
          <p className="step-how-it-works__description">
            Craft thoughtful messages, farewell notes, or specific final
            instructions to be delivered to loved ones in the future. Whether
            it’s emotional closure or practical guidance, you decide the tone,
            content, and timing. The Plan Beyond ensures these are shared
            exactly as intended, when it matters most.
          </p>
          {/* <ul className="step-how-it-works__list">
            <li className="step-how-it-works__list-item">
              Safely store IDs, wills, insurance policies, and more.
            </li>
            <li className="step-how-it-works__list-item">
              Access your documents anytime, anywhere, on any device
            </li>
            <li className="step-how-it-works__list-item">
              Enjoy peace of mind with advanced encryption & privacy controls.
            </li>
          </ul> */}
        </div>
        <div className="step-how-it-works__image-container step-how-it-works__image-right">
          <img
            src={step5Image1}
            alt="Step 5 Form"
            className="step-how-it-works__step5-image"
          />
          <img
            src={step5Image2}
            alt="Step 5 Background"
            className="step-how-it-works__step5-background-image"
          />
        </div>
      </div>
    </div>
  );
};

export default StepHowItWorks;

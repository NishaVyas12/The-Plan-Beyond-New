import React, { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIcon from "../../../assets/images/icons/plan.svg";

const Register = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const openTermsPopup = () => setShowTermsPopup(true);
  const closeTermsPopup = () => setShowTermsPopup(false);
  const openPrivacyPopup = () => setShowPrivacyPopup(true);
  const closePrivacyPopup = () => setShowPrivacyPopup(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        { email, password },
        { withCredentials: true }
      );
      if (response.data.success) {
        setShowOtpInput(true);
        toast.success("Registration successful! OTP sent to your email.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
      if (response.data.success) {
        toast.success(
          "OTP verified successfully! Redirecting to dashboard...",
          {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        setTimeout(() => {
          navigate("/popups");
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "OTP verification failed.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <img src={logoIcon} alt="The Plan Beyond Logo" className="login-logo" />
      </header>
      <div className="login-card">
        <h2>Sign Up for The Plan Beyond</h2>
        <p className="login-subtext">Safeguard your future, your way.</p>

        {!showOtpInput ? (
          <form onSubmit={handleRegister}>
            <div className="login-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-form-group password-container">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={togglePasswordVisibility}
              >
                <i
                  className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}
                ></i>
              </span>
            </div>
            <div className="login-form-group password-container">
              <label>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={toggleConfirmPasswordVisibility}
              >
                <i
                  className={
                    showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"
                  }
                ></i>
              </span>
            </div>
            <div className="login-remember">
              <div>
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={() => setTermsAccepted(!termsAccepted)}
                />
                <label htmlFor="terms">
                  Agree to our{" "}
                  <span className="terms-link" onClick={openTermsPopup}>
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="terms-link" onClick={openPrivacyPopup}>
                    Privacy Policy
                  </span>
                </label>
              </div>
            </div>
            <button type="submit" className="login-btn">
              Create Account
            </button>
            <p className="login-signup-text">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="login-form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter the OTP sent to your email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Verify OTP
            </button>
          </form>
        )}
      </div>

      {showTermsPopup && (
        <div className="register-popup">
          <div className="register-popup-content">
            <h3>Terms of Service</h3>
            <p>
              Effective Date: May 05, 2025 <br/><br/>Please read these Terms and
              Conditions ("Terms") carefully before using our website, mobile
              applications, and services (collectively, the “Platform”). <br/>By
              accessing or using TPB, you agree to be bound by these Terms.<br/> If
              you do not agree, please do not use the Platform. <br/><br/>1. Eligibility<br/>
              You must be at least 18 years of age and legally capable of
              entering into binding contracts to use this Platform. By creating
              an account, you confirm you meet these criteria. <br/><br/>2. Account
              Registration <br/>To access certain features, you are required to
              register and create an account. You agree to provide accurate,
              current, and complete information and to update this information
              as needed. You are responsible for maintaining the confidentiality
              of your login credentials and for all activities under your
              account. <br/><br/>3. Services Provided <br/>TPB allows users to: <br/>Store and
              manage documents, passwords, memories, and final wishes <br/>Designate
              Ambassadors or Nominees to handle data post-death<br/> Schedule
              posthumous messages <br/>Use legacy planning tools like memory tagging,
              subscriptions tracking, and reward transfers <br/>Download or export
              data via secure USB options<br/> TPB does not provide legal, medical,
              or financial advice. We may integrate with third-party service
              providers for such services, but we are not liable for their
              performance. <br/><br/>4. Payment and Subscription <br/>We offer both free and
              paid subscription plans.<br/> Monthly and Yearly Plans: Users can
              choose between monthly or discounted yearly billing. <br/>Free Trial: A
              7-day trial may be offered, during which no payment is required.
              <br/>Cancellation: You may cancel anytime via your dashboard. Yearly
              plan cancellations are eligible for partial refund for the unused
              period, upon request by your Nominee or Ambassador. <br/>No Refunds for
              Monthly Plans: Unless legally required, we do not offer refunds on
              monthly subscriptions. <br/><br/>5. Data Ownership and Access <br/>You retain
              ownership of all content and data uploaded to your account. TPB
              acts as a secure custodian. <br/>Posthumous access to your data is
              controlled by your appointed Ambassadors and subject to
              dual-authentication protocols. TPB reserves the right to verify
              death notifications before unlocking any sensitive data. <br/><br/>6.
              Termination <br/>You may delete your account at any time. TPB also
              reserves the right to suspend or terminate your account if: <br/>You
              violate these Terms <br/>You engage in fraudulent or abusive behavior
              <br/>Required by law or governmental request <br/><br/>7. Limitation of Liability<br/>
              To the maximum extent permitted by law, TPB, its officers,
              employees, and affiliates shall not be liable for any indirect,
              incidental, special, or consequential damages arising from: <br/>Use or
              inability to use the platform <br/>Unauthorized access to your data
              <br/>Errors, inaccuracies, or data loss beyond our control <br/>Our total
              liability will not exceed the amount paid by you for the service
              in the preceding 12 months.<br/><br/> 8. Privacy <br/>Your privacy is important
              to us. Please refer to our Privacy Policy to understand how we
              collect, use, and protect your data.<br/><br/> 9. Modifications TPB reserves
              the right to modify these Terms at any time. If material changes
              are made, we will notify you via email or dashboard notification.
              Continued use of the Platform constitutes your acceptance of the
              revised Terms. <br/><br/>10. Governing Law These Terms are governed by the
              laws of India. Any legal action or proceeding arising under these
              Terms shall be brought in the courts of India. <br/><br/>11. Contact If you
              have questions or concerns, please contact us at: <br/>email:
              support@theplanbeyond.com
            </p>
            <button className="popup-close-btn" onClick={closeTermsPopup}>
              Close
            </button>
          </div>
        </div>
      )}

      {showPrivacyPopup && (
        <div className="register-popup">
          <div className="register-popup-content">
            <h3>Privacy Policy</h3>
            <p>
              Effective Date: May 05, 2025 <br /><br />Your privacy is not a feature. It’s a
              promise. <br/>This Privacy Policy explains how The Plan Beyond (TPB)
              collects, uses, stores, and protects your personal information
              when you use our platform. <br/>By accessing or using TPB, you consent
              to the practices described in this policy. <br/><br/>1. Information We
              Collect <br/>We collect the following types of information: <br/>a. Personal
              Information Full name Email address Phone number Date of birth
              Relationship data (e.g., Ambassadors/Nominees) <br/>b. Uploaded Content
              Contacts (Phone, email, social media) Documents (e.g., wills, IDs,
              policies) Photos, videos, messages Account passwords Subscription
              and reward details Scheduled or posthumous messages <br/>c. Device &
              Usage Information IP address Browser type Operating system Device
              identifiers Usage logs (e.g., login times, actions taken) <br/><br/>2. How
              We Use Your Information We use your data to: <br/>Provide core services
              such as storage, tagging, and scheduled messages <br/>Facilitate
              Ambassador/Nominee access management <br/>Improve platform performance
              and user experience <br/>Communicate with you regarding updates or
              support <br/>Ensure account security and fraud detection <br/>Comply with
              legal obligations <br/><br/>3. Sharing and Disclosure We do not sell or rent
              your data. <br/>We only share data: <br/>With your designated Ambassadors or
              Nominees, after verification and only as per your permissions With
              trusted third-party service providers (e.g., cloud storage,
              legal/insurance aggregators) under strict confidentiality
              agreements <br/>If legally required by law, court order, or regulatory
              authority<br/><br/> 4. Data Security We use: <br/>AES-256 encryption for data at
              rest <br/>TLS/SSL encryption for data in transit <br/>Multi-factor
              authentication (MFA) <br/>Role-based access control <br/>Regular
              vulnerability scans and security audits <br/>HIPAA & SOC 2-aligned
              protocols <br/>Offline data downloads (e.g., USB backups) are secured
              with dynamic, expiring passwords. <br/><br/>5. Your Rights & Controls You
              have the right to:<br/> Access or update your personal information at
              any time <br/>Request account deletion <br/>Withdraw consent (subject to
              legal retention obligations) <br/>Export your data Designate who can
              access what after your passing <br/>To exercise any of these rights,
              email us at privacy@theplanbeyond.com <br/><br/>6. Data Retention We retain
              your data:<br/> As long as your account is active <br/>For a grace period
              post-death, as determined by your plan and nominee decisions<br/>
              Unless otherwise instructed by you or your authorized
              representative <br/><br/>7. Cookies and Tracking TPB uses cookies to:
              <br/>Maintain session security Analyze site usage for improvement <br/>Store
              user preferences <br/>You can manage cookie preferences via your
              browser settings. <br/><br/>8. Children’s Privacy TPB is not intended for
              users under the age of 18. <br/>We do not knowingly collect personal
              data from minors. <br/>If discovered, such data will be deleted
              promptly. <br/><br/>9. International Transfers <br/>If you’re accessing TPB
              outside of India, your data may be transferred to, stored, and
              processed in regions with different data protection laws. We
              ensure all transfers comply with applicable legal standards. <br/><br/>10.
              Changes to This Policy <br/>We may update this Privacy Policy
              periodically. Material changes will be communicated via email or
              dashboard notifications. Continued use of TPB means you accept the
              updated policy. <br/><br/>11. Contact Us If you have questions about this
              policy or your data,<br/> contact us at: email:
              privacy@theplanbeyond.com
            </p>
            <button className="popup-close-btn" onClick={closePrivacyPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Register;

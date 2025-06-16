import React, { useState, useEffect } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIcon from "../../../assets/images/icons/planbeyond.svg";
import faceIcon from "../../../assets/images/icons/face.svg"; 
import fingerprintIcon from "../../../assets/images/icons/fingerprint.svg"; 
import { startRegistration } from "@simplewebauthn/browser";

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
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if WebAuthn is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setIsBiometricSupported(available);
        })
        .catch(() => setIsBiometricSupported(false));
    }
  }, []);

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
      toast.error("Please fill in all fields.");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        { email, password },
        { withCredentials: true }
      );
      if (response.data.success) {
        setUserId(response.data.userId);
        setShowOtpInput(true);
        toast.success("Registration successful! OTP sent to your email.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
      if (response.data.success) {
        setUserId(response.data.userId);
        toast.success("OTP verified successfully!");
        setShowOtpInput(false);
        // Show biometric option only if supported, otherwise redirect
        if (isBiometricSupported) {
          setShowBiometricOption(true);
        } else {
          toast.info("Biometric authentication not supported. Redirecting...");
          setTimeout(() => navigate("/popups"), 2000);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "OTP verification failed.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricRegistration = async () => {
    if (!isBiometricSupported) {
      toast.error("Biometric authentication is not supported on this device.");
      return skipBiometric();
    }

    if (!userId) {
      toast.error("User ID not found. Please try registering again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register-biometric`,
        { email, userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        const options = response.data.options;
        const regResponse = await startRegistration(options);

        const verificationResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/verify-biometric-registration`,
          { response: regResponse, userId },
          { withCredentials: true }
        );

        if (verificationResponse.data.success) {
          toast.success("Biometric registration successful! Redirecting...");
          setTimeout(() => navigate("/popups"), 2000);
        } else {
          toast.error("Biometric registration verification failed.");
        }
      }
    } catch (err) {
      console.error("Biometric registration error:", err);
      const errorMessage = err.response?.data?.message || "Biometric registration failed.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const skipBiometric = () => {
    toast.success("Redirecting to dashboard...");
    setTimeout(() => navigate("/popups"), 2000);
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <img src={logoIcon} alt="The Plan Beyond Logo" className="login-logo" />
      </header>
      <div className="login-card">
        {!showOtpInput && !showBiometricOption ? (
          <>
            <h2>Sign Up for The Plan Beyond</h2>
            <p className="login-subtext">Safeguard your future, your way.</p>
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
                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
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
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
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
              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? "Processing..." : "Create Account"}
              </button>
              <p className="login-signup-text">
                Already have an account? <Link to="/login">Sign In</Link>
              </p>
            </form>
          </>
        ) : showOtpInput ? (
          <form onSubmit={handleOtpSubmit}>
            <h2>Verify Your Email</h2>
            <p className="login-subtext">Enter the OTP sent to your email.</p>
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
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          <div className="biometric-options">
            <h2>Enable Biometric Authentication</h2>
            <p className="login-subtext">Secure your account with Face ID or Fingerprint for faster logins.</p>
            {isBiometricSupported && (
              <div className="biometric-login">
                <button
                  type="button"
                  className="biometric-option"
                  onClick={handleBiometricRegistration}
                  disabled={isLoading}
                >
                  <img src={faceIcon} alt="Face Icon" className="biometric-icon" />
                </button>
                <p className="or-text">OR</p>
                <button
                  type="button"
                  className="biometric-option"
                  onClick={handleBiometricRegistration}
                  disabled={isLoading}
                >
                  <img src={fingerprintIcon} alt="Fingerprint Icon" className="biometric-icon" />
                </button>
              </div>
            )}
            <button
              className="login-btn secondary-btn"
              onClick={skipBiometric}
              disabled={isLoading}
            >
              Skip for Now
            </button>
          </div>
        )}
      </div>

      {showTermsPopup && (
        <div className="register-popup">
          <div className="register-popup-content">
            <h3>Terms of Service</h3>
            <p>Placeholder for Terms of Service content.</p>
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
            <p>Placeholder for Privacy Policy content.</p>
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
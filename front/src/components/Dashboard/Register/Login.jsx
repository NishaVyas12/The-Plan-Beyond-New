import React, { useState, useEffect, useRef } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIcon from "../../../assets/images/icons/plan.svg";
import { startAuthentication } from '@simplewebauthn/browser';

const MIN_PASSWORD_LENGTH = 8;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const navigate = useNavigate();
  const passwordAttempts = useRef(0);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
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

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.success) {
        const userId = response.data.userId;
        const userType = response.data.userType;
        sessionStorage.setItem("userId", userId);

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        toast.success("Login successful! Redirecting...", {
          position: "top-right",
          autoClose: 2000,
        });

        setTimeout(() => {
          // Redirect based on userType
          if (userType === "user") {
            navigate("/dashboard");
          } else if (userType === "ambassador") {
            navigate("/send-message");
          }
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed.";
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmNewPasswordVisibility = () => {
    setShowConfirmNewPassword(!showConfirmNewPassword);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error("Please enter your email.", {
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
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email: forgotEmail },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("OTP sent to your email.", {
          position: "top-right",
          autoClose: 3000,
        });
        setForgotPasswordStep("otp");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send OTP.";
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

  const handleVerifyOtp = async (e) => {
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
        { email: forgotEmail, otp, isPasswordReset: true },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("OTP verified successfully.", {
          position: "top-right",
          autoClose: 3000,
        });
        setForgotPasswordStep("password");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid OTP.";
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

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error("Please enter and confirm your new password.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
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

    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Password must be 8-100 characters, include uppercase, lowercase, number, and special character.",
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      return;
    }

    passwordAttempts.current += 1;
    if (passwordAttempts.current > 5) {
      toast.error("Too many attempts. Please try again later.", {
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
        `${import.meta.env.VITE_API_URL}/api/reset-password`,
        { email: forgotEmail, otp, newPassword, confirmNewPassword },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Password updated successfully! Returning to login...", {
          position: "top-right",
          autoClose: 3000,
        });
        passwordAttempts.current = 0;
        setTimeout(() => {
          setForgotPasswordStep(null);
          setForgotEmail("");
          setOtp("");
          setNewPassword("");
          setConfirmNewPassword("");
        }, 3000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update password.";
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

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setForgotPasswordStep("email");
  };

const handleBiometricLogin = async () => {
  try {
    // Use environment variable for API URL
    const optionsResponse = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/login-biometric`,
      {},
      { withCredentials: true }
    );

    if (!optionsResponse.data.success) {
      throw new Error("Failed to get biometric options");
    }

    // Start authentication with received options
    const authResponse = await startAuthentication(optionsResponse.data.options);

    // Verify the authentication
    const verifyResponse = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/verify-biometric-login`,
      { response: authResponse },
      { withCredentials: true }
    );

    if (verifyResponse.data.success) {
      const { userId, userType } = verifyResponse.data;
      sessionStorage.setItem("userId", userId);
      
      toast.success("Biometric login successful! Redirecting...", {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        if (userType === "user") {
          navigate("/dashboard");
        } else if (userType === "ambassador") {
          navigate("/send-message");
        }
      }, 2000);
    } else {
      throw new Error(verifyResponse.data.message || "Biometric login failed");
    }
  } catch (error) {
    console.error("Biometric login error:", error);
    toast.error(`Biometric login failed: ${error.message}`, {
      position: "top-right",
      autoClose: 3000,
    });
  }
};

  return (
    <div className="login-container">
      <header className="login-header">
        <img src={logoIcon} alt="The Plan Beyond Logo" className="login-logo" />
      </header>
      <div className="login-card">
        <h2>Welcome Back The Plan Beyond</h2>
        <p className="login-subtext">Securely manage your life and legacy</p>

        {!forgotPasswordStep ? (
          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Aiyana10@hotmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-form-group password-container">
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
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
            <div className="login-remember">
              <div>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember">Remember Me</label>
              </div>
              <a
                href="#forgot"
                className="login-forgot-password"
                onClick={handleForgotPasswordClick}
              >
                Forgot Password?
              </a>
            </div>
            <button type="submit" className="login-btn">
              Log In
            </button>
            <button type="submit" className="login-btn" onClick={handleBiometricLogin}>
              Log In with Biometric
            </button>
            <p className="login-signup-text">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </form>
        ) : forgotPasswordStep === "email" ? (
          <form onSubmit={handleForgotPassword}>
            <div className="login-form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Continue
            </button>
            <p className="login-signup-text">
              Back to{" "}
              <Link to="/login" onClick={() => setForgotPasswordStep(null)}>
                Login
              </Link>
            </p>
          </form>
        ) : forgotPasswordStep === "otp" ? (
          <form onSubmit={handleVerifyOtp}>
            <div className="login-form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Verify OTP
            </button>
            <p className="login-signup-text">
              Back to{" "}
              <Link to="/login" onClick={() => setForgotPasswordStep(null)}>
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="login-form-group password-container">
              <label>New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={toggleNewPasswordVisibility}
              >
                <i
                  className={
                    showNewPassword ? "fas fa-eye-slash" : "fas fa-eye"
                  }
                ></i>
              </span>
            </div>
            <div className="login-form-group password-container">
              <label>Confirm New Password</label>
              <input
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={toggleConfirmNewPasswordVisibility}
              >
                <i
                  className={
                    showConfirmNewPassword ? "fas fa-eye-slash" : "fas fa-eye"
                  }
                ></i>
              </span>
            </div>
            <button type="submit" className="login-btn">
              Reset Password
            </button>
            <p className="login-signup-text">
              Back to{" "}
              <Link to="/login" onClick={() => setForgotPasswordStep(null)}>
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
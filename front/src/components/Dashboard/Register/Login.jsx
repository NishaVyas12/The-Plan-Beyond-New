import React, { useState, useEffect } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';
import logoIcon from "../../../assets/images/icons/planbeyond.svg";
import faceIcon from "../../../assets/images/icons/face.svg";
import fingerprintIcon from '../../../assets/images/icons/fingerprint.svg';
import { startAuthentication } from '@simplewebauthn/browser';
import CryptoJS from 'crypto-js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isFaceIdSupported, setIsFaceIdSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
    setShowOtp(false);
    setOtp('');
    setForgotPasswordStep(null);

    console.log("Checking WebAuthn support...");
    console.log("Navigator platform:", navigator.platform);
    console.log("Navigator userAgent:", navigator.userAgent);

    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          console.log("WebAuthn platform authenticator available:", available);
          setIsBiometricSupported(available);

          // Stricter heuristic for Face ID support
          const isIOS = /iPhone|iPad/.test(navigator.platform);
          const isMacWithFaceID = /Mac/.test(navigator.platform) && 
                                  navigator.userAgent.includes("AppleWebKit") && 
                                  // Assume recent Macs with TrueDepth (rough heuristic)
                                  navigator.userAgent.includes("Version/15") || navigator.userAgent.includes("Version/16");
          const isWindowsHelloFace = /Windows/.test(navigator.platform) && 
                                     navigator.userAgent.includes("Edge") && 
                                     // Check for Windows Hello face support (approximation)
                                     available;

          const isLikelyFaceIdDevice = isIOS || isMacWithFaceID || isWindowsHelloFace;
          setIsFaceIdSupported(available && isLikelyFaceIdDevice);
          console.log("Face ID support determined:", isLikelyFaceIdDevice, {
            isIOS,
            isMacWithFaceID,
            isWindowsHelloFace
          });
        })
        .catch((err) => {
          console.error("Error checking WebAuthn support:", err);
          setIsBiometricSupported(false);
          setIsFaceIdSupported(false);
          toast.error('Biometric authentication not supported.', {
            position: 'top-right',
            autoClose: 3000,
          });
        });
    } else {
      console.log("WebAuthn not supported in this browser.");
      setIsBiometricSupported(false);
      setIsFaceIdSupported(false);
      toast.error('Biometric authentication not supported in this browser.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }

    let storeEmail = localStorage.getItem('rememberedEmail');
    if (storeEmail) {
      setRememberMe(true);
      setEmail(storeEmail);
    }

    let baseDeviceId = localStorage.getItem('baseDeviceId');
    if (!baseDeviceId) {
      baseDeviceId = uuidv4();
      localStorage.setItem('baseDeviceId', baseDeviceId);
    }
  }, []);

  useEffect(() => {
    if (email) {
      const baseDeviceId = localStorage.getItem('baseDeviceId');
      const userDeviceId = CryptoJS.SHA256(email + baseDeviceId).toString();
      setDeviceId(userDeviceId);
    } else {
      setDeviceId('');
    }
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        { email, password, rememberMe, deviceId, userAgent: navigator.userAgent },
        { withCredentials: true }
      );

      if (response.data.success) {
        const { userId, userType } = response.data;
        sessionStorage.setItem('userId', userId);

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        toast.success('Login successful! Redirecting...', {
          position: 'top-right',
          autoClose: 2000,
        });

        setTimeout(() => {
          navigate(userType === 'user' ? '/dashboard' : '/send-message');
        }, 2000);
      } else if (response.data.requiresOtp) {
        setShowOtp(true);
        setShowEmailLogin(false);
        toast.success('OTP sent to your email to verify this device.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-login-otp`,
        { email, otp, deviceId, trustDevice: rememberMe, userAgent: navigator.userAgent },
        { withCredentials: true }
      );

      if (response.data.success) {
        const { userId, userType } = response.data;
        sessionStorage.setItem('userId', userId);

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        toast.success('OTP verified! Redirecting...', {
          position: 'top-right',
          autoClose: 2000,
        });

        setTimeout(() => {
          navigate(userType === 'user' ? '/dashboard' : '/send-message');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid OTP.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async (type) => {
    console.log(`Initiating ${type} login with deviceId:`, deviceId);
    if (!isBiometricSupported) {
      console.log("Biometric authentication not supported.");
      toast.error('Biometric authentication is not supported on this device.');
      return;
    }

    if (type === "face" && !isFaceIdSupported) {
      console.log("Face ID not supported on this device.");
      toast.error('Your device does not support Face ID.');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Sending ${type} login request to backend...`);
      const optionsResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login-biometric`,
        { deviceId, biometricType: type },
        { withCredentials: true }
      );

      if (!optionsResponse.data.success) {
        console.log(`${type} login options request failed:`, optionsResponse.data.message);
        throw new Error(optionsResponse.data.message || `Failed to get ${type} options`);
      }

      console.log(`${type} login options received:`, optionsResponse.data.options);
      const authResponse = await startAuthentication(optionsResponse.data.options);
      console.log(`${type} WebAuthn authentication response:`, authResponse);

      const verifyResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-biometric-login`,
        { response: authResponse, deviceId, biometricType: type },
        { withCredentials: true }
      );

      if (verifyResponse.data.success) {
        console.log(`${type} login verified successfully.`);
        const { userId, userType } = verifyResponse.data;
        sessionStorage.setItem('userId', userId);

        toast.success(`${type === "face" ? "Face ID" : "Fingerprint"} login successful! Redirecting...`, {
          position: 'top-right',
          autoClose: 2000,
        });

        setTimeout(() => {
          navigate(userType === 'user' ? '/dashboard' : '/send-message');
        }, 2000);
      } else {
        console.log(`${type} login verification failed:`, verifyResponse.data.message);
        toast.error(verifyResponse.data.message || `${type === "face" ? "Face ID" : "Fingerprint"} login failed.`);
      }
    } catch (err) {
      console.error(`${type} login error:`, err);
      const errorMessage = err.response?.data?.message || 
        (err.name === "NotAllowedError" && type === "face" 
          ? "Your device does not support Face ID or permission was denied." 
          : `${type === "face" ? "Face ID" : "Fingerprint"} login failed.`);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmNewPasswordVisibility = () => setShowConfirmNewPassword(!showConfirmNewPassword);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error('Please enter your email.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email: forgotEmail },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('OTP sent to your email.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setForgotPasswordStep('otp');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error('Please enter the OTP.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-otp`,
        { email: forgotEmail, otp, isPasswordReset: true },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('OTP verified successfully.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setForgotPasswordStep('password');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid OTP.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast.error('Please enter and confirm your new password.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.', {
        position: 'top-right',
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
        'Password must be 8-100 characters, include uppercase, lowercase, number, and special character.',
        {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reset-password`,
        { email: forgotEmail, otp, newPassword, confirmNewPassword },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Password updated successfully! Returning to login...', {
          position: 'top-right',
          autoClose: 3000,
        });
        setTimeout(() => {
          setForgotPasswordStep(null);
          setForgotEmail('');
          setOtp('');
          setNewPassword('');
          setConfirmNewPassword('');
          setShowEmailLogin(false);
          setShowOtp(false);
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update password.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setForgotPasswordStep('email');
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <img src={logoIcon} alt="The Plan Beyond Logo" className="login-logo" />
      </header>
      <div className="login-card">
        {(showEmailLogin || showOtp) && (
          <button
            className="back-button"
            onClick={() => {
              setShowEmailLogin(false);
              setShowOtp(false);
            }}
          >
            ← Back
          </button>
        )}
        <h2>Welcome Back to The Plan Beyond</h2>
        <p className="login-subtext">Securely manage your life and legacy</p>

        {!forgotPasswordStep && !showEmailLogin && !showOtp ? (
          <>
            {isBiometricSupported && (
              <div className="biometric-login">
                {isFaceIdSupported && (
                  <button
                    type="button"
                    className="biometric-option"
                    onClick={() => {
                      console.log("Face ID button clicked");
                      handleBiometricLogin("face");
                    }}
                    disabled={isLoading}
                    title="Log in with Face ID"
                  >
                    <img src={faceIcon} alt="Face Icon" className="biometric-icon" />
                  </button>
                )}
                {isFaceIdSupported && isBiometricSupported && (
                  <p className="or-text">OR</p>
                )}
                {isBiometricSupported && (
                  <button
                    type="button"
                    className="biometric-option"
                    onClick={() => {
                      console.log("Fingerprint button clicked");
                      handleBiometricLogin("fingerprint");
                    }}
                    disabled={isLoading}
                    title="Log in with Fingerprint"
                  >
                    <img src={fingerprintIcon} alt="Fingerprint Icon" className="biometric-icon" />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              className="login-btn"
              onClick={() => setShowEmailLogin(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Log In with Email'}
            </button>
            <p className="login-signup-text">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </>
        ) : !forgotPasswordStep && showEmailLogin && !showOtp ? (
          <form onSubmit={handleLogin}>
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
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={togglePasswordVisibility}
              >
                <i
                  className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}
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
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
            <p className="login-signup-text">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </form>
        ) : !forgotPasswordStep && showOtp ? (
          <form onSubmit={handleVerifyLoginOtp}>
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
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <p className="login-signup-text">
              Back to{' '}
              <Link
                to="/login"
                onClick={() => {
                  setShowEmailLogin(true);
                  setShowOtp(false);
                }}
              >
                Login
              </Link>
            </p>
          </form>
        ) : forgotPasswordStep === 'email' ? (
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
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Continue'}
            </button>
            <p className="login-signup-text">
              Back to{' '}
              <Link
                to="/login"
                onClick={() => {
                  setForgotPasswordStep(null);
                  setShowEmailLogin(false);
                  setShowOtp(false);
                }}
              >
                Login
              </Link>
            </p>
          </form>
        ) : forgotPasswordStep === 'otp' ? (
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
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <p className="login-signup-text">
              Back to{' '}
              <Link
                to="/login"
                onClick={() => {
                  setForgotPasswordStep(null);
                  setShowEmailLogin(false);
                  setShowOtp(false);
                }}
              >
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="login-form-group password-container">
              <label>New Password</label>
              <input
                type={showNewPassword ? 'text' : 'password'}
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
                  className={showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}
                ></i>
              </span>
            </div>
            <div className="login-form-group password-container">
              <label>Confirm New Password</label>
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={toggleConfirmNewPasswordVisibility}
              >
                <i
                  className={
                    showConfirmNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'
                  }
                ></i>
              </span>
            </div>
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
            <p className="login-signup-text">
              Back to{' '}
              <Link
                to="/login"
                onClick={() => {
                  setForgotPasswordStep(null);
                  setShowEmailLogin(false);
                  setShowOtp(false);
                }}
              >
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
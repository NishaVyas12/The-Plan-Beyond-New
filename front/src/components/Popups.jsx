import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Country } from "country-state-city";
import dashboardImage from "../assets/images/dash_icon/dash.png";
import welcomeIllustration from "../assets/images/Homepage/popup.svg";
import popup2Illustration from "../assets/images/Homepage/popup2.svg";
import popup3Illustration from "../assets/images/Homepage/popup3.svg";
import popup4Illustration from "../assets/images/Homepage/popup4.svg";
import popup5Illustration from "../assets/images/Homepage/popup5.svg";
import popup6Illustration from "../assets/images/Homepage/popup6.svg";
import arrowLeft from "../assets/images/icons/green_arrow.svg";
import "./Popups.css";

const Popups = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [userId, setUserId] = useState(null);
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    gender: "",
    dateOfBirth: "",
    country: "",
  });
  const navigate = useNavigate();

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today.setFullYear(today.getFullYear() - 18));
    return maxDate.toISOString().split("T")[0]; 
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/check-session`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          setUserId(data.userId);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        navigate("/login");
      }
    };

    fetchUserId();
    setCurrentStep(0);
  }, [navigate]);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const handleContinue = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (currentStep === 1) {
      if (
        personalInfo.fullName &&
        personalInfo.gender &&
        personalInfo.dateOfBirth &&
        personalInfo.country
      ) {
        setFormData((prev) => ({
          ...prev,
          personalInfo,
        }));
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/popup/submit`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ responses: { personalInfo } }),
          });

          const data = await response.json();
          if (data.success) {
            setCurrentStep(currentStep + 1);
          } else {
            console.error("Failed to submit popup data:", data.message);
            setCurrentStep(currentStep + 1); 
          }
        } catch (error) {
          console.error("Error submitting popup data:", error);
          setCurrentStep(currentStep + 1); 
        }
      }
      return;
    }

    if (currentStep === 6) {
      navigate("/dashboard");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const countries = Country.getAllCountries();

  return (
    <div className="popups-container">
      <img
        src={dashboardImage}
        alt="Dashboard Background"
        className="popups-background"
      />
      <div className="popups-overlay">
        <div className="popups-content">
          {currentStep === 0 ? (
            <div className="popups-welcome-content">
              <img
                src={welcomeIllustration}
                alt="Welcome Illustration"
                className="popups-welcome-illustration"
              />
              <h2 className="popups-welcome-title">
                Welcome to The Plan Beyond
              </h2>
              <p className="popups-welcome-subtitle">
                Life doesn’t come with a manual. But the future? You can shape
                it. The Plan Beyond. helps you organize what truly matters from
                vital documents to decisions no one wants to leave hanging.
                <br /><br/>
                It’s about making things easier for the people you love, and
                lighter for the you of tomorrow.
              </p>
              <button
                className="popups-start-btn"
                onClick={() => setCurrentStep(1)}
              >
                Let’s get started!
              </button>
            </div>
          ) : (
            <div className="popups-setup-content">
              <div className="popups-header">
                <button className="popups-back-btn" onClick={handleBack}>
                  <img
                    src={arrowLeft}
                    alt="Back Arrow"
                    className="popups-back-arrow"
                  />
                </button>
                {currentStep >= 2 && (
                  <h3 className="popups-setup-title">Account Set up</h3>
                )}
              </div>
              {currentStep >= 2 && (
                <div className="popups-progress">
                  <div className="popups-progress-bar">
                    <div
                      className="popups-progress-filled"
                      style={{ width: `${(currentStep * 100) / 6}%` }}
                    ></div>
                  </div>
                  <span className="popups-progress-text">{currentStep}/6</span>
                </div>
              )}
              {currentStep === 1 && (
                <>
                  <img
                    src={welcomeIllustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">You’re one step closer to clarity.</h2>
                  <p className="popups-subtitle">
                    Fill in the basics to kickstart your journey with The Plan Beyond.
                  </p>
                  <div className="popups-form">
                    <div className="popups-form-row">
                      <div className="popups-form-field">
                        <label htmlFor="fullName" className="popups-label">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={personalInfo.fullName}
                          onChange={handlePersonalInfoChange}
                          className="popups-input"
                        />
                      </div>
                      <div className="popups-form-field">
                        <label htmlFor="gender" className="popups-label">
                          Gender
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={personalInfo.gender}
                          onChange={handlePersonalInfoChange}
                          className="popups-input"
                        >
                          <option value="" disabled>
                            Select Gender
                          </option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="popups-form-row">
                      <div className="popups-form-field">
                        <label htmlFor="dateOfBirth" className="popups-label">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={personalInfo.dateOfBirth}
                          onChange={handlePersonalInfoChange}
                          className="popups-input"
                          max={getMaxDate()} 
                        />
                      </div>
                      <div className="popups-form-field">
                        <label htmlFor="country" className="popups-label">
                          Country
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={personalInfo.country}
                          onChange={handlePersonalInfoChange}
                          className="popups-input"
                        >
                          <option value="" disabled>
                            Select Country
                          </option>
                          {countries.map((country) => (
                            <option key={country.isoCode} value={country.isoCode}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <img
                    src={popup2Illustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">Set your profile</h2>
                  <p className="popups-subtitle">
                    Create your account, fill in your details, and select<br/> trusted 
                    nominees.
                  </p>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <img
                    src={popup3Illustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">Add Your Connection</h2>
                  <p className="popups-subtitle">
                    Include family, friends, or others you want notified when the<br/>
                    time comes.
                  </p>
                </>
              )}
              {currentStep === 4 && (
                <>
                  <img
                    src={popup4Illustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">Nominee Access and Notification</h2>
                  <p className="popups-subtitle">
                    Nominees can securely access and act on the information you've<br/>
                    assigned to them.
                  </p>
                </>
              )}
              {currentStep === 5 && (
                <>
                  <img
                    src={popup5Illustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">Add Information to Vault</h2>
                  <p className="popups-subtitle">
                    Securely upload your wishes, messages, and digital details after<br/>
                    identity authentication.
                  </p>
                </>
              )}
              {currentStep === 6 && (
                <>
                  <img
                    src={popup6Illustration}
                    alt="Step Illustration"
                    className="popups-step-illustration"
                  />
                  <h2 className="popups-title">Legacy Activation</h2>
                  <p className="popups-subtitle">
                    When you’re gone, your nominee will trigger custom notifications and share your<br/>
                    messages with selected loved ones.
                  </p>
                </>
              )}
              {currentStep === 1 ? (
                <button
                  className="popups-continue-btn"
                  onClick={handleContinue}
                  disabled={
                    !personalInfo.fullName ||
                    !personalInfo.gender ||
                    !personalInfo.dateOfBirth ||
                    !personalInfo.country
                  }
                >
                  Save & Continue
                </button>
              ) : (
                <div className="popups-button-group">
                  {currentStep < 6 && (
                    <button
                      className="popups-skip-btn"
                      onClick={handleSkip}
                    >
                      Skip
                    </button>
                  )}
                  <button
                    className="popups-continue-btn"
                    onClick={handleContinue}
                  >
                    {currentStep === 6 ? "Submit" : "Continue"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popups;
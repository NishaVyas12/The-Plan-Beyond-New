import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import tele from "../../../assets/images/icons/tele.svg";
import Letter from "../../../assets/images/icons/Letter.svg";
import Subscription from "../../../assets/images/icons/Subscription.svg";
import leaf from "../../../assets/images/icons/leaf.svg";
import leftArrow from "../../../assets/images/icons/leftArrow.svg";
import rightArrow from "../../../assets/images/icons/rightArrow.svg";
import homeSmile from "../../../assets/images/icons/homeSmile.svg";
import user from "../../../assets/images/icons/user.svg";
import Smartphone from "../../../assets/images/icons/Smartphone.svg";
import Videocamera from "../../../assets/images/icons/Videocamera.svg";
import Gallery from "../../../assets/images/icons/Gallery.svg";
import Soundwave from "../../../assets/images/icons/Soundwave.svg";
import Star from "../../../assets/images/icons/Star.svg";
import letsStarted from "../../../assets/images/icons/letsStarted.svg";
import vidThumbnail from "../../../assets/images/icons/vidThumbnail.svg";
import Play from "../../../assets/images/icons/Play.svg";
import financialIcon from "../../../assets/images/sidebar/icon8.svg";
import legal from "../../../assets/images/sidebar/Legal.svg";
import health from "../../../assets/images/sidebar/icon7.svg";
import Family from "../../../assets/images/sidebar/icon9.svg";
import Gone from "../../../assets/images/sidebar/icon10.svg";
import Popups from "../../Popups";
// import sampleVideo from "../../../assets/videos/TPB.mp4";

const Dash = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    full_name: "",
    email: "",
    address: "",
    date_of_birth: "",
    phone_number: "",
    profile_image: null,
  });
  const [nomineeCount, setNomineeCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [ambassadorCount, setAmbassadorCount] = useState(0);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showSetupPopup, setShowSetupPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/get-profile`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success && data.profile) {
          const fullName = [data.profile.first_name, data.profile.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          const addressParts = [data.profile.state, data.profile.country]
            .filter(Boolean)
            .join(", ");
          setProfile({
            first_name: data.profile.first_name,
            full_name: fullName,
            email: data.profile.email || "",
            address: addressParts || "",
            date_of_birth: data.profile.date_of_birth || "",
            phone_number: data.profile.phone_number || "",
            profile_image: data.profile.profile_image
              ? `${import.meta.env.VITE_API_URL}/${data.profile.profile_image}`
              : null,
          });
        } else {
          console.warn("Profile fetch unsuccessful:", data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data.");
      }
    };

    const fetchContacts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/contacts`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success) {
          setContactCount(data.total);
        } else {
          console.warn("Contacts fetch unsuccessful:", data);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setError("Failed to load contacts data.");
      }
    };

    const fetchNominees = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/nominees`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success) {
          setNomineeCount(data.nominees.length);
        } else {
          console.warn("Nominees fetch unsuccessful:", data);
        }
      } catch (error) {
        console.error("Error fetching nominees:", error);
        setError("Failed to load nominees data.");
      }
    };

    const fetchAmbassadors = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ambassadors`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success) {
          setAmbassadorCount(data.ambassadors.length);
        } else {
          console.warn("Ambassadors fetch unsuccessful:", data);
        }
      } catch (error) {
        console.error("Error fetching ambassadors:", error);
        setError("Failed to load ambassadors data.");
      }
    };

    const checkPopupStatus = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/popup/status`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success && data.hasResponses) {
          localStorage.setItem("popupCompleted", "true");
          setShowSetupPopup(false);
        } else {
          setShowSetupPopup(true);
        }
      } catch (error) {
        console.error("Error checking popup status:", error);
        setError("Failed to load popup status.");
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProfile(),
          fetchContacts(),
          fetchNominees(),
          fetchAmbassadors(),
          checkPopupStatus(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && showVideoPopup) {
        closeVideoPopup();
      }
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showVideoPopup]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const cardWidth = 300;
      const gap = 25;
      const scrollAmount = cardWidth + gap;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const openVideoPopup = () => {
    setShowVideoPopup(true);
  };

  const closeVideoPopup = () => {
    setShowVideoPopup(false);
  };

  const handlePopupComplete = async () => {
    localStorage.setItem("popupCompleted", "true");
    setShowSetupPopup(false);
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dash-container">
      <div className="dash-main-content">
        <main className="dash-content">
          <div className="dash-welcome">
            <h2 className="dash-welcome-text">
              {getGreeting()},{" "}
              {profile.first_name || "Welcome to The Plan Beyond"}!
            </h2>
          </div>
          <div className="dash-tabs">
            <div
              className="dash-tab dash-tab-contacts"
              onClick={() => navigate("/add-contact")}
              style={{ cursor: "pointer" }}
            >
              <div className="dash-icon-wrapper">
                <img src={tele} alt="Contact icon" className="dash-tab-icon" />
              </div>
              <div className="dash-tab-content">
                <span className="dash-tab-head">Total Contacts</span>
                <span className="dash-tab-count">{contactCount} Contacts</span>
              </div>
            </div>
            <div
              className="dash-tab dash-tab-messages"
              onClick={() => navigate("/record-video")}
              style={{ cursor: "pointer" }}
            >
              <div className="dash-icon-wrapper">
                <img src={Letter} alt="Message icon" className="dash-tab-icon" />
              </div>
              <div className="dash-tab-content">
                <span className="dash-tab-head">End-Of-Life Messages</span>
                <span className="dash-tab-count">{videoCount} Added</span>
              </div>
            </div>
            <div className="dash-tab dash-tab-subscription">
              <div className="dash-icon-wrapper">
                <img
                  src={Subscription}
                  alt="Subscription icon"
                  className="dash-tab-icon"
                />
              </div>
              <div className="dash-tab-content">
                <span className="dash-tab-head">Subscription</span>
                <span className="dash-tab-count">Trial</span>
              </div>
              <div className="subscription-remaining">10 days remaining</div>
            </div>
          </div>
          <div className="dash-details">
            <div className="dash-personal-info">
              <div className="dash-personal-header">
                <h3 className="dash-section-title">Personal Details</h3>
              </div>
              <div className="dash-profile-card">
                <div className="dash-info">
                  <div className="dash-info-grid">
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Full Name</span>
                      <p>{profile.full_name || "NA"}</p>
                    </div>
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Email</span>
                      <p>{profile.email || "NA"}</p>
                    </div>
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Address</span>
                      <p>{profile.address || "NA"}</p>
                    </div>
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Date of Birth</span>
                      <p>{profile.date_of_birth || "NA"}</p>
                    </div>
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Phone</span>
                      <p>{profile.phone_number || "NA"}</p>
                    </div>
                    <div className="dash-info-item">
                      <span className="dash-info-item-head">Identification</span>
                      <p>{profile.identification || "NA"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="dash-ambassadors">
              <div className="dash-ambassador-header">
                <h3 className="dash-section-title">Storage</h3>
              </div>
              <div className="storage-widget">
                <div className="storage-progress">
                  <svg className="progress-ring">
                    <circle
                      className="progress-ring-bg"
                      stroke="#D9F0EC"
                      strokeWidth="8"
                      fill="transparent"
                      r="30"
                      cx="40"
                      cy="40"
                    />
                    <circle
                      className="progress-ring-bar"
                      stroke="#007C65"
                      strokeWidth="8"
                      fill="transparent"
                      r="30"
                      cx="40"
                      cy="40"
                      strokeDasharray="188.4"
                      strokeDashoffset="84.78"
                    />
                    <text
                      x="40"
                      y="45"
                      textAnchor="middle"
                      fill="#000"
                      fontSize="14px"
                      fontWeight="600"
                    >
                      55%
                    </text>
                  </svg>
                </div>
                <div className="storage-info">
                  <div className="usage-label">Total Usage</div>
                  <div className="storage-amount">30 GB</div>
                  <div className="storage-label">Used of 50 GB</div>
                </div>
              </div>
              <hr className="dash-separator-bottom" />
            </div>
          </div>
          <div className="dash-right-section">
            <div className="dash-right-row">
              <div className="dash-plan-beyond">
                <h3 className="dash-section-title">Assign by You</h3>
                <div className="dash-categories">
                  <div
                    className="dash-category"
                    onClick={() => navigate("/nominee")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="dash-category-content">
                      <span className="dash-category-name">Nominees</span>
                      <p className="dash-category-desc">{nomineeCount} Contacts Added</p>
                    </div>
                    <div className="dash-category-action">
                      <span className="dash-action-inline">
                        <img src={leaf} alt="leaf" />
                        <p>Add Nominees</p>
                      </span>
                    </div>
                  </div>
                  <div
                    className="dash-category"
                    onClick={() => navigate("/ambassador")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="dash-category-content">
                      <span className="dash-category-name">Ambassador’s</span>
                      <p className="dash-category-desc">{ambassadorCount} Contacts Added</p>
                    </div>
                    <div className="dash-category-action">
                      <span className="dash-action-inline">
                        <img src={leaf} alt="leaf" />
                        <p>Add Ambassador</p>
                      </span>
                    </div>
                  </div>
                  <Link to="/home-property-info" className="dash-category">
                    <div className="dash-category-content">
                      <span className="dash-category-name">
                        Emergency Contacts
                      </span>
                      <p className="dash-category-desc">5 Contacts Added</p>
                    </div>
                    <div className="dash-category-action">
                      <span className="dash-action-inline">
                        <img src={leaf} alt="leaf" />
                        <p>Add Contacts</p>
                      </span>
                    </div>
                  </Link>
                </div>
                <hr className="dash-separator-bottom" />
              </div>
            </div>
          </div>
          <div className="dash-slider-section">
            <div className="dash-slider-header">
              <h3 className="dash-section-title">Explore Your Assets</h3>
              <div className="dash-slider-controls">
                <img
                  src={leftArrow}
                  alt="Left"
                  onClick={() => scrollSlider("left")}
                />
                <img
                  src={rightArrow}
                  alt="Right"
                  onClick={() => scrollSlider("right")}
                />
              </div>
            </div>
            <div className="dash-slider-wrapper">
              <div className="dash-slider" id="slider" ref={sliderRef}>
                <div
                  className="slider-category"
                  onClick={() => navigate("/personal-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={user} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Personal Info & IDs
                    </span>
                    <p>Who you are, all in one place</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/digital-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={Smartphone} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">Digital Assets</span>
                    <p>Secure your online world</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/home-property-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={homeSmile} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Real Estate & Assets
                    </span>
                    <p>Map what you own, clearly</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/financial-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={financialIcon} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Financial Plan
                    </span>
                    <p>Your money, your future organized</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/legal-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={legal} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Legal Docs
                    </span>
                    <p>Secure your online world.</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/health-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={health} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Health Info
                    </span>
                    <p>Vital health details.</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/family-id")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={Family} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      Family Contacts
                    </span>
                    <p>Your circle close and connected</p>
                  </div>
                </div>
                <div
                  className="slider-category"
                  onClick={() => navigate("/after-gone-info")}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dash-user-bg">
                    <img src={Gone} alt="" />
                  </div>
                  <div className="slider-content-div">
                    <span className="slider-category-name">
                      End-of-Life Wishes
                    </span>
                    <p>Say what matters. Even in goodbye.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="quick-links-section">
            <div className="quick-links-row">
              <div className="quick-links-container">
                <h3 className="quick-links-title">Quick Links</h3>
                <div className="quick-links-grid">
                  <Link to="#" className="quick-link-card">
                    <img
                      src={Videocamera}
                      alt="Record Video"
                      className="quick-link-icon"
                    />
                    <span className="quick-link-label">Record Video Message</span>
                  </Link>
                  <Link to="#" className="quick-link-card">
                    <img
                      src={Gallery}
                      alt="Upload Photos"
                      className="quick-link-icon"
                    />
                    <span className="quick-link-label">Upload Photos</span>
                  </Link>
                  <Link to="#" className="quick-link-card">
                    <img
                      src={Soundwave}
                      alt="Record Audio"
                      className="quick-link-icon"
                    />
                    <span className="quick-link-label">Record Audio Message</span>
                  </Link>
                  <Link to="#" className="quick-link-card">
                    <img src={Star} alt="What's New" className="quick-link-icon" />
                    <span className="quick-link-label">What's New</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="guide-section">
            <h3 className="guide-section-title">Your Guide for The Plan Beyond</h3>
            <div className="guide-cards-grid">
              <div className="guide-card">
                <img
                  src={letsStarted}
                  alt="Let's Get Started"
                  className="guide-image"
                />
                <div className="guide-content">
                  <h4 className="guide-title">Let’s Get Started</h4>
                  <p className="guide-description">
                    Your 101 guide to securing information on the platform and
                    accessing it whenever you need it.
                  </p>
                </div>
              </div>
              <div className="guide-card video-card" onClick={openVideoPopup} style={{ cursor: "pointer" }}>
                <div className="video-wrapper">
                  <img src={vidThumbnail} alt="Thumbnail" className="guide-image" />
                  <img className="play-button" src={Play} alt="Play" />
                </div>
              </div>
            </div>
          </div>

          {showVideoPopup && (
  <div className="video-popup-overlay">
    <div className="video-popup">
      <button className="video-popup-close" onClick={closeVideoPopup}>
        ×
      </button>
      <video
        className="video-player"
        src={"sampleVideo"}
        controls
        autoPlay
      ></video>
    </div>
  </div>
)}
          {showSetupPopup && (
            <Popups onComplete={handlePopupComplete} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dash;
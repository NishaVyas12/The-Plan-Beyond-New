import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./New_Header.css";
import logo from "../assets/images/icons/new_logo.svg";

const New_Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
    setIsMenuOpen(false);
  };

  const handleRegisterClick = () => {
    navigate("/register");
    setIsMenuOpen(false);
  };

  const handleAboutClick = () => {
    navigate("/about");
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="new-header-header">
      <img
        src={logo}
        alt="Logo"
        className="new-header-logo"
        onClick={handleLogoClick}
        style={{ cursor: "pointer" }}
      />
      <nav className={`new-header-nav-links ${isMenuOpen ? "active" : ""}`}>
        <a onClick={handleHomeClick} style={{ cursor: "pointer" }}>
          Home
        </a>
        <a onClick={handleAboutClick} style={{ cursor: "pointer" }}>
          About
        </a>
        <a
          onClick={() => {
            navigate("/how-it-works", { replace: true });
            setIsMenuOpen(false);
          }}
          style={{ cursor: "pointer" }}
        >
          How It Works
        </a>
        <a
          onClick={() => {
            navigate("/security", { replace: true });
            setIsMenuOpen(false);
          }}
          style={{ cursor: "pointer" }}
        >
          Security
        </a>
        <a
          onClick={() => {
            navigate("/contact-us", { replace: true });
            setIsMenuOpen(false);
          }}
          style={{ cursor: "pointer" }}
        >
          Contact
        </a>
        <div className="new-header-auth-buttons mobile-auth-buttons">
          <button className="new-header-login-btn" onClick={handleLoginClick}>
            Log In
          </button>
          <button
            className="new-header-register-btn"
            onClick={handleRegisterClick}
          >
            Register
          </button>
        </div>
      </nav>
      <div className="new-header-auth-buttons desktop-auth-buttons">
        <button className="new-header-login-btn" onClick={handleLoginClick}>
          Log In
        </button>
        <button
          className="new-header-register-btn"
          onClick={handleRegisterClick}
        >
          Register
        </button>
      </div>
      <div className={`hamburger ${isMenuOpen ? "active" : ""}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </header>
  );
};

export default New_Header;
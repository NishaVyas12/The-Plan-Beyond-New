import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../assets/images/icons/logo.svg";

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className={`header-header ${isMenuOpen ? "menu-open" : ""}`}>
      <div className="header-top-row">
        <img
          src={logo}
          alt="Logo"
          className="header-logo"
          onClick={() => handleNavigate("/")}
          style={{ cursor: "pointer" }}
        />
        <button className="header-hamburger" onClick={toggleMenu}>
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav className={`header-nav-links ${isMenuOpen ? "active" : ""}`}>
        <a onClick={() => handleNavigate("/")}>Home</a>
        <a onClick={() => handleNavigate("/about")}>About</a>
        <a onClick={() => handleNavigate("/how-it-works")}>How It Works</a>
        <a onClick={() => handleNavigate("/security")}>Security</a>
        <a onClick={() => handleNavigate("/contact-us")}>Contact</a>
      </nav>

      <div className={`header-auth-buttons ${isMenuOpen ? "active" : ""}`}>
        <button className="header-login-btn" onClick={() => handleNavigate("/login")}>
          Log In
        </button>
        <button className="header-register-btn" onClick={() => handleNavigate("/register")}>
          Register
        </button>
      </div>
    </header>
  );
};

export default Header;
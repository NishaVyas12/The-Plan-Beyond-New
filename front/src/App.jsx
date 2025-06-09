import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Footer from "./components/Footer";
import "./App.css";
import New_Header from "./components/New_Header";
import PrivacyPage from "./components/Policies/PrivacyPolicy";
import TermsCondition from "./components/Policies/TermsCondition";
import HowItWorksPage from "./pages/HowItWorksPage";
import Cookie from "./components/Policies/Cookie";
import HelpCenter from "./components/Policies/HelpCenter";
import Blog from "./components/Blog/Blog";
import ContactUs from "./pages/ContactUs";
import Blog1 from "./components/Blog/Blog1";
import Blog2 from "./components/Blog/Blog2";
import Blog3 from "./components/Blog/Blog3";
import Blog4 from "./components/Blog/Blog4";
import Blog5 from "./components/Blog/Blog5";
import Security from "./pages/Security";
import Pricing from "./pages/Pricing";
import Feedback from "./pages/Feedback";
import FeedbacksPage from "./pages/FeedbacksPage";
import Confirmation from "./pages/Confirmation";
import DashboardPage from "./pages/DashboardPage";
import ContactPage from "./pages/ContactPage";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/check-session`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setIsAuthenticated(data.success && data.userId);
      } catch (error) {
        console.error("Session check error:", error);
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const FeedbackWrapper = () => {
  const location = useLocation();
  const feedbackRoutes = [
    '/dashboard',
    '/profile',
    '/personal-info',
    '/digital-info',
    '/financial-info',
    '/home-property-info',
    '/health-info',
    '/family-loved-one-info',
    '/after-gone-info',
    '/legal-info',
    '/record-video',
    '/add-contact',
    '/popups',
    '/nominee',
    '/ambassador'
  ];

  return feedbackRoutes.includes(location.pathname) ? <Feedback /> : null;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <HomePage />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <New_Header />
                <AboutPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <>
                <New_Header />
                <HowItWorksPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/contact-us"
            element={
              <>
                <New_Header />
                <ContactUs />
                <Footer />
              </>
            }
          />
          <Route
            path="/security"
            element={
              <>
                <New_Header />
                <Security />
                <Footer />
              </>
            }
          />
          <Route
            path="/pricing"
            element={
              <>
                <New_Header />
                <Pricing />
                <Footer />
              </>
            }
          />
          {/* <Route
            path="/reviews"
            element={
              <>
                <New_Header />
                <Reviews />
                <Footer />
              </>
            }
          /> */}
          <Route
            path="/blog1"
            element={
              <>
                <New_Header />
                <Blog1 />
                <Footer />
              </>
            }
          />
          <Route
            path="/blog2"
            element={
              <>
                <New_Header />
                <Blog2 />
                <Footer />
              </>
            }
          />
          <Route
            path="/blog3"
            element={
              <>
                <New_Header />
                <Blog3 />
                <Footer />
              </>
            }
          />
          <Route
            path="/blog4"
            element={
              <>
                <New_Header />
                <Blog4 />
                <Footer />
              </>
            }
          />
          <Route
            path="/blog5"
            element={
              <>
                <New_Header />
                <Blog5 />
                <Footer />
              </>
            }
          />
          <Route
            path="/blogs"
            element={
              <>
                <New_Header />
                <Blog />
                <Footer />
              </>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <>
                <New_Header />
                <PrivacyPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/terms-and-condition"
            element={
              <>
                <New_Header />
                <TermsCondition />
                <Footer />
              </>
            }
          />
          <Route
            path="/cookie"
            element={
              <>
                <New_Header />
                <Cookie />
                <Footer />
              </>
            }
          />
          <Route
            path="/help-center"
            element={
              <>
                <New_Header />
                <HelpCenter />
                <Footer />
              </>
            }
          />
          <Route
            path="/all-feedbacks"
            element={
              <>
                <New_Header />
                <FeedbacksPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/confirmation"
            element={
              <>
                <New_Header />
                <Confirmation />
                <Footer />
              </>
            }
          />
          <Route
            path="/dashboard"
            element={
              <>
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              </>
            }
          />
          <Route
            path="/add-contact"
            element={
              <>
                <PrivateRoute>
                  <ContactPage />
                </PrivateRoute>
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
        <FeedbackWrapper />
      </div>
    </Router>
  );
}

export default App;
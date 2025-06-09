import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./navbar.css";
import logo from "../../../assets/images/icons/dashlogo.svg";
import { useSidebar } from "../../../context/SidebarContext";
import dashUser from "../../../assets/images/icons/dashUser.svg"
import dashNotify from "../../../assets/images/icons/dashNotify.svg"
import notificationDot from "../../../assets/images/icons/notificationDot.svg"
import down from "../../../assets/images/icons/down.svg"
import Search from "../../../assets/images/icons/Search.svg"

const Navbar = () => {
    const { toggleSidebar } = useSidebar();
    const [profile, setProfile] = useState({
        full_name: "Name",
        profile_image: null,
    });
    const navigate = useNavigate();

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

                    setProfile({
                        full_name: fullName || "Name",
                        profile_image: data.profile.profile_image
                            ? `${import.meta.env.VITE_API_URL}/${data.profile.profile_image}`
                            : null,
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchProfile();
    }, []);

    return (
        <nav className="dash-navbar">
            <div className="dash-navbar-brand">
                <img
                    src={logo}
                    alt="The Plan Beyond Logo"
                    className="dash-brand-logo"
                    onClick={() => navigate("/dashboard")}
                    style={{ cursor: "pointer" }}
                />
                <div className="hamburger-menu" onClick={toggleSidebar}>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </div>
            </div>

            <div className="dash-search-bar">
                <input
                    type="text"
                    className="dash-search-input"
                    placeholder="Search here..."
                />
                <img src={Search} alt="Search" className="search-icon" />
            </div>


            <div className="dash-nav-right">
                {/* <span className="dash-user-name">Security</span>
                <span className="dash-user-name">Help</span> */}

                <div className="dash-notification">
                    <img src={dashNotify} alt="Notify" />
                    {/* <img className="new-notify" src={notificationDot} alt="New Notification" /> */}
                </div>
                <div
                    className="dash-user-profile"
                    onClick={() => navigate("/profile")}
                    style={{ cursor: "pointer" }}
                >
                    {profile.profile_image ? (
                        <img
                            src={profile.profile_image}
                            alt="User Avatar"
                            className="dash-user-avatar"
                        />
                    ) : (
                        <div className="dash-user-avatar">
                            <img
                                src={dashUser}
                                alt="User Avatar"
                                className="dash-user-avatar"
                            />
                        </div>
                    )}
                    <span className="dash-user-name">{profile.full_name}</span>
                    {/* <img src={down} alt="" /> */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
import React, { useState, useEffect } from "react";
import "./sidebar.css";
import dashboardIcon from "../../../assets/images/sidebar/icon1.svg";
import profileIcon from "../../../assets/images/sidebar/icon2.svg";
import personalIcon from "../../../assets/images/sidebar/icon3.svg";
import nomineeIcon from "../../../assets/images/sidebar/icon4.svg";
import digitalIcon from "../../../assets/images/sidebar/icon5.svg";
import homeIcon from "../../../assets/images/sidebar/icon6.svg";
import health from "../../../assets/images/sidebar/icon7.svg";
import financialIcon from "../../../assets/images/sidebar/icon8.svg";
import Family from "../../../assets/images/sidebar/icon9.svg";
import Gone from "../../../assets/images/sidebar/icon10.svg";
import settingsIcon from "../../../assets/images/sidebar/icon11.svg";
import logoutIcon from "../../../assets/images/sidebar/icon12.svg";
import legal from "../../../assets/images/sidebar/Legal.svg";
import contact from "../../../assets/images/sidebar/contact.svg";
import familyInfo from "../../../assets/images/sidebar/familyInfo.svg";
import addBook from "../../../assets/images/sidebar/addBook.svg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSidebar } from "../../../context/SidebarContext";

const Sidebar = () => {
    const { isSidebarOpen, closeSidebar } = useSidebar();
    const navigate = useNavigate();
    const [showNewAmbassadorTab, setShowNewAmbassadorTab] = useState(false);

    // useEffect(() => {
    //     const fetchUserStatus = async () => {
    //         try {
    //             const userId = sessionStorage.getItem("userId");
    //             if (!userId) {
    //                 console.error("No userId found in sessionStorage");
    //                 return;
    //             }

    //             const response = await axios.get(
    //                 `${import.meta.env.VITE_API_URL}/api/check-user-status`,
    //                 {
    //                     withCredentials: true,
    //                     params: { userId },
    //                 }
    //             );

    //             if (response.data.success && response.data.is_verified === 1 && response.data.ambassador_accept === 1) {
    //                 setShowNewAmbassadorTab(true);
    //             }
    //         } catch (err) {
    //             console.error("Error fetching user status:", err);
    //         }
    //     };

    //     fetchUserStatus();
    // }, []);

    return (
        <>

            <aside className={`dash-sidebar ${isSidebarOpen ? "open" : ""}`}>
                <ul className="dash-sidebar-menu">
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/dashboard");
                            closeSidebar()
                        }}
                    >
                        <div className="dash-icon">
                            <img
                                src={dashboardIcon}
                                alt="Dashboard icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Dashboard
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/add-contact");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={contact}
                                alt="Settings icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Contact
                    </li>
                    <li className="dash-sidebar-item" onClick={() => {
                        navigate("/profile");
                        closeSidebar()
                    }}>
                        <div className="dash-icon">
                            <img
                                src={profileIcon}
                                alt="Profile icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        My Profile
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/personal-info");
                            closeSidebar()
                        }}
                    >
                        <div className="dash-icon">
                            <img
                                src={personalIcon}
                                alt="Personal icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Personal Info & IDs
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/personal-info");
                            closeSidebar()
                        }}
                    >
                        <div className="dash-icon">
                            <img
                                src={familyInfo}
                                alt="Personal icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Family Info & IDs
                    </li>
                    <li className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/ambassador");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={nomineeIcon}
                                alt="Nominee icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Ambassadors
                    </li>
                    <li className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/nominee");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={nomineeIcon}
                                alt="Nominee icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Nominees
                    </li>
                    {showNewAmbassadorTab && (
                        <>
                            <li className="dash-sidebar-heading">Assigned to me</li>
                            <li
                                className="dash-sidebar-item"
                                onClick={() => {
                                    navigate("/send-message-1");
                                    closeSidebar()
                                }}>
                                <div className="dash-icon">
                                    <img
                                        src={nomineeIcon}
                                        alt="Ambassador icon"
                                        className="dash-sidebar-icon"
                                    />
                                </div>
                                Ambassadors
                            </li>
                        </>
                    )}
                    <li className="dash-sidebar-item dash-border-bottom"></li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/digital-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={digitalIcon}
                                alt="Digital icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Digital Assets
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/home-property-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img src={homeIcon} alt="Home icon" className="dash-sidebar-icon" />
                        </div>
                        Real Estate & Assets
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/health-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img src={health} alt="Home icon" className="dash-sidebar-icon" />
                        </div>
                        Health Info
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/legal-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img src={legal} alt="Home icon" className="dash-sidebar-icon" />
                        </div>
                        Legal Docs
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/financial-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={financialIcon}
                                alt="Financial icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Financial Plan
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/family-loved-one-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img src={Family} alt="Home icon" className="dash-sidebar-icon" />
                        </div>
                        Family Contacts
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/after-gone-info");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img src={Gone} alt="Home icon" className="dash-sidebar-icon" />
                        </div>
                        End-of-Life Wishes
                    </li>
                    <li
                        className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/add-contact");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={addBook}
                                alt="Settings icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Address Book
                    </li>
                    <li className="dash-sidebar-item dash-border-bottom"></li>

                    <li className="dash-sidebar-item"
                        onClick={() => {
                            navigate("/profile");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={settingsIcon}
                                alt="Settings icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Settings
                    </li>
                    <li
                        className="dash-sidebar-item dash-logout"
                        onClick={() => {
                            navigate("/login");
                            closeSidebar()
                        }}>
                        <div className="dash-icon">
                            <img
                                src={logoutIcon}
                                alt="Logout icon"
                                className="dash-sidebar-icon"
                            />
                        </div>
                        Log Out
                    </li>
                </ul>
            </aside>
        </>
    );
};

export default Sidebar;
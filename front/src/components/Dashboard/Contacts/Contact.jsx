import React, { useState } from "react";
import "./Contact.css";
import folderIcon from "../../../assets/images/Contact/folder.svg";
import GoogleIcon from "../../../assets/images/Contact/Google.svg";
import CustomIcon from "../../../assets/images/Contact/Custom.svg";
import PhoneIcon from "../../../assets/images/Contact/Smartphone.svg";
import VFCIcon from "../../../assets/images/Contact/VFC.svg";

const Contact = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    return (
        <div className="contact-page">
            <h2 className="contact-title">Contacts</h2>

            <div className="contact-empty-box">
                <img src={folderIcon} alt="Folder Icon" className="contact-folder-icon" />
                <h4 className="contact-empty-heading">This folder is empty</h4>
                <p className="contact-empty-subtext">
                    Add your contact through Google, phone, or customize your own.
                </p>
                <button className="contact-add-button" onClick={toggleDrawer}>
                    + Add Contacts
                </button>
            </div>

            {/* Drawer */}
            <div className={`contact-drawer ${isDrawerOpen ? "open" : ""}`}>
                <div className="contact-drawer-top">
                    <button className="drawer-close-btn" onClick={toggleDrawer}>×</button>
                </div>
                <div className="drawer-divider" />
                <h3 className="contact-drawer-heading">Add People to contact Lists</h3>

                <div className="contact-drawer-options">
                    <div className="drawer-option">
                        <div className="drawer-icon-circle">
                            <img src={PhoneIcon} alt="" />
                        </div>
                        <span className="drawer-option-label">Sync on Mobile</span>
                    </div>

                    <div className="drawer-option">
                        <div className="drawer-icon-circle">
                            <img src={GoogleIcon} alt="" />
                        </div>
                        <span className="drawer-option-label">Sync on Google Contact</span>
                    </div>

                    <div className="drawer-option">
                        <div className="drawer-icon-circle">
                            <img src={VFCIcon} alt="" />
                        </div>
                        <span className="drawer-option-label">Upload vcf File</span>
                    </div>

                    <div className="drawer-option">
                        <div className="drawer-icon-circle">
                            <img src={CustomIcon} alt="" />
                        </div>
                        <span className="drawer-option-label">Add Custom Contact</span>
                    </div>
                </div>
            </div>

            {isDrawerOpen && <div className="contact-drawer-backdrop" onClick={toggleDrawer}></div>}
        </div>
    );
};

export default Contact;
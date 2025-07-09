import React, { useState, useRef, useEffect } from "react";

const ClubsPopup = ({
  formData,
  handleInputChange,
  allContacts,
  nomineeContacts,
  handleCloseModal,
  handleFileChange,
  handleSubmit,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    club: false,
    club_contact: false,
    membership_status: false,
    nominee: false,
  });
  const dropdownRefs = {
    club: useRef(null),
    club_contact: useRef(null),
    membership_status: useRef(null),
    nominee: useRef(null),
  };

  const handleSelect = (name, value, event) => {
    event.stopPropagation();
    handleInputChange({ target: { name, value } });
    // Map the input name to the correct dropdown state key
    const dropdownKey = name === "nomineeContact" ? "nominee" : name;
    setDropdownStates((prev) => ({ ...prev, [dropdownKey]: false }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs).forEach((key) => {
        if (dropdownRefs[key].current && !dropdownRefs[key].current.contains(event.target)) {
          setDropdownStates((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const organizationOptions = [
    'Gymkhana Clubs',
    'Rotary Club of India',
    'Lions Club International – India Chapters',
    'Round Table India',
    'Inner Wheel Club (women’s wing of Rotary)',
    'Toastmasters India',
    'Jaycees India (JCI)',
    'Others'
  ];

  const contactOptions = allContacts?.map(item => ({
    value: `${item.name} (${item.phone_number})`,
    label: `${item.name} (${item.phone_number})`
  })) || [];

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "clubs").label}</h2>

      <label>
        Name of Organization
        <div className="personal-custom-dropdown" ref={dropdownRefs.club}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, club: !prev.club, club_contact: false, membership_status: false, nominee: false }))}
          >
            {formData.club || "Select organization"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.club && (
            <ul className="personal-dropdown-menu">
              {organizationOptions.map((option) => (
                <li
                  key={option}
                  onClick={(e) => handleSelect("club", option, e)}
                  className="personal-dropdown-option"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {formData.club === "Others" && (
        <label>
          Specify Organization Name
          <input
            type="text"
            name="club_name"
            value={formData.club_name || ""}
            onChange={handleInputChange}
            placeholder="Enter the organization name"
            required
          />
        </label>
      )}

      <label>
        Organization Contact Info
        <div className="personal-custom-dropdown" ref={dropdownRefs.club_contact}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, club_contact: !prev.club_contact, club: false, membership_status: false, nominee: false }))}
          >
            {formData.club_contact || "Select contact info"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.club_contact && (
            <ul className="personal-dropdown-menu">
              <li
                key="default"
                onClick={(e) => handleSelect("club_contact", "", e)}
                className="personal-dropdown-option"
              >
                Select contact info
              </li>
              {contactOptions.map((contact) => (
                <li
                  key={contact.value}
                  onClick={(e) => handleSelect("club_contact", contact.value, e)}
                  className="personal-dropdown-option"
                >
                  {contact.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Membership Type
        <input
          type="text"
          name="membership_type"
          value={formData.membership_type || ""}
          onChange={handleInputChange}
          placeholder="e.g., Regular, Lifetime, Honorary"
        />
      </label>

      <label>
        Membership Status
        <div className="personal-custom-dropdown" ref={dropdownRefs.membership_status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, membership_status: !prev.membership_status, club: false, club_contact: false, nominee: false }))}
          >
            {formData.membership_status === "true" ? "Active" : formData.membership_status === "false" ? "Inactive" : "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.membership_status && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((status) => (
                <li
                  key={status}
                  onClick={(e) => handleSelect("membership_status", status, e)}
                  className="personal-dropdown-option"
                >
                  {status === "true" ? "Active" : "Inactive"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Nominee Contact
        <div className="personal-custom-dropdown" ref={dropdownRefs.nominee}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, club: false, club_contact: false, membership_status: false }))}
          >
            {formData.nomineeContact || "Select a nominee"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.nominee && (
            <ul className="personal-dropdown-menu">
              <li
                key="default"
                onClick={(e) => handleSelect("nomineeContact", "", e)}
                className="personal-dropdown-option"
              >
                Select a nominee
              </li>
              {nomineeContacts.map((contact) => (
                <li
                  key={contact.id}
                  onClick={(e) => handleSelect("nomineeContact", contact.email || contact.name, e)}
                  className="personal-dropdown-option"
                >
                  {contact.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Upload scans or photos of documents
        <div className="personal-file-upload">
          <input
            type="file"
            name="files"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/jpeg,image/png,application/pdf,image/gif"
            id="file-input"
          />
          <label htmlFor="file-input">
            <img src={uploadIcon} alt="Upload" className="personal-upload-icon" />
            <span>Select or drag your files here</span>
          </label>
          <p>Please upload clear scans/photos of your documents.</p>
          {formData.files && formData.files.length > 0 && (
            <div className="personal-file-list">
              {Array.from(formData.files).map((file, index) => (
                <div key={index} className="personal-file-item">
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </label>

      <label>
        Any Special Instructions or Details?
        <textarea
          name="notes"
          value={formData.notes || ""}
          onChange={handleInputChange}
          placeholder="Enter any relevant details or instructions."
        />
      </label>

      <div className="personal-button-group">
        <button type="submit">Save</button>
        <button className="personal-btn-cancel" onClick={handleCloseModal}>Cancel</button>
      </div>
    </form>
  );
};

export default ClubsPopup;
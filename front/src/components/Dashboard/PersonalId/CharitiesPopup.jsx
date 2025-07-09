import React, { useState, useRef, useEffect } from "react";

const CharitiesPopup = ({
  formData,
  handleInputChange,
  nomineeContacts,
  handleCloseModal,
  handleFileChange,
  handleSubmit,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    frequency: false,
    enrolled: false,
    nominee: false,
  });
  const dropdownRefs = {
    frequency: useRef(null),
    enrolled: useRef(null),
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

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "charities").label}</h2>

      <label>
        Name of charity or cause
        <input
          type="text"
          name="charity_name"
          value={formData.charity_name || ""}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Website or phone number
        <input
          type="text"
          name="charity_website"
          value={formData.charity_website || ""}
          onChange={handleInputChange}
        />
      </label>

      <label>
        Payment Mode
        <input
          type="text"
          name="payment_method"
          value={formData.payment_method || ""}
          onChange={handleInputChange}
        />
      </label>

      <label>
        Amount
        <input
          type="number"
          name="amount"
          value={formData.amount || ""}
          onChange={handleInputChange}
          min="0"
          step="0.01"
        />
      </label>

      <label>
        Payment Frequency
        <div className="personal-custom-dropdown" ref={dropdownRefs.frequency}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, frequency: !prev.frequency, enrolled: false, nominee: false }))}
          >
            {formData.frequency || "Select payment frequency"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.frequency && (
            <ul className="personal-dropdown-menu">
              {["weekly", "monthly", "quarterly", "yearly"].map((freq) => (
                <li
                  key={freq}
                  onClick={(e) => handleSelect("frequency", freq, e)}
                  className="personal-dropdown-option"
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Enrolled in auto-pay?
        <div className="personal-custom-dropdown" ref={dropdownRefs.enrolled}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, enrolled: !prev.enrolled, frequency: false, nominee: false }))}
          >
            {formData.enrolled === "true" ? "Yes" : formData.enrolled === "false" ? "No" : "Select"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.enrolled && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((enroll) => (
                <li
                  key={enroll}
                  onClick={(e) => handleSelect("enrolled", enroll, e)}
                  className="personal-dropdown-option"
                >
                  {enroll === "true" ? "Yes" : "No"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Nominee Contact
        <div className="personal-custom-dropdown" as="div" ref={dropdownRefs.nominee}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, frequency: false, enrolled: false }))}
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
        />
      </label>

      <div className="personal-button-group">
        <button type="submit">Save</button>
        <button className="personal-btn-cancel" onClick={handleCloseModal}>Cancel</button>
      </div>
    </form>
  );
};

export default CharitiesPopup;
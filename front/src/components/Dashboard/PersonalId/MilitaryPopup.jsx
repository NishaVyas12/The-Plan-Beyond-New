import React, { useState, useRef, useEffect } from "react";

const MilitaryPopup = ({
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
    military_branch: false,
    service_status: false,
    nominee: false,
  });
  const dropdownRefs = {
    military_branch: useRef(null),
    service_status: useRef(null),
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

  const branchOptions = ['Army', 'Navy', 'Air Force', 'Others'];

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "military").label}</h2>

      <label>
        Which branch did you serve?
        <div className="personal-custom-dropdown" ref={dropdownRefs.military_branch}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, military_branch: !prev.military_branch, service_status: false, nominee: false }))}
          >
            {formData.military_branch || "Select branch"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.military_branch && (
            <ul className="personal-dropdown-menu">
              {branchOptions.map((option) => (
                <li
                  key={option}
                  onClick={(e) => handleSelect("military_branch", option, e)}
                  className="personal-dropdown-option"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {formData.military_branch === "Others" && (
        <label>
          Specify Branch Name
          <input
            type="text"
            name="military_name"
            value={formData.military_name || ""}
            onChange={handleInputChange}
            placeholder="Enter the branch name"
            required
          />
        </label>
      )}

      <label>
        What rank did you achieve?
        <input
          type="text"
          name="military_rank"
          value={formData.military_rank || ""}
          onChange={handleInputChange}
          placeholder="Enter your rank (e.g., Sergeant, Captain)"
        />
      </label>

      <label>
        Service Type
        <input
          type="text"
          name="service_type"
          value={formData.service_type || ""}
          onChange={handleInputChange}
          placeholder="e.g., Active Duty, Reserve, National Guard"
        />
      </label>

      <label>
        When did you serve?
        <input
          type="text"
          name="military_serve"
          value={formData.military_serve || ""}
          onChange={handleInputChange}
          placeholder="Enter service period (e.g., 2000-2005)"
        />
      </label>

      <label>
        Service Status
        <div className="personal-custom-dropdown" ref={dropdownRefs.service_status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, service_status: !prev.service_status, military_branch: false, nominee: false }))}
          >
            {formData.service_status === "true" ? "Retired" : formData.service_status === "false" ? "Active" : "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.service_status && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((status) => (
                <li
                  key={status}
                  onClick={(e) => handleSelect("service_status", status, e)}
                  className="personal-dropdown-option"
                >
                  {status === "true" ? "Retired" : "Active"}
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, military_branch: false, service_status: false }))}
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
        Location of important documents or discharge papers
        <input
          type="text"
          name="military_location"
          value={formData.military_location || ""}
          onChange={handleInputChange}
          placeholder="Example: In my safe"
        />
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

export default MilitaryPopup;
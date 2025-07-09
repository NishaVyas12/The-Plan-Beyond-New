import React, { useState, useRef, useEffect } from "react";

const MiscellaneousPopup = ({
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
    status: false,
    nominee: false,
  });
  const dropdownRefs = {
    status: useRef(null),
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
        if (
          dropdownRefs[key].current &&
          !dropdownRefs[key].current.contains(event.target)
        ) {
          setDropdownStates((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "miscellaneous").label}</h2>

      <label>
        Name of Miscellaneous Item
        <input
          type="text"
          name="item"
          value={formData.item || ""}
          onChange={handleInputChange}
          placeholder="Enter item name"
          required
        />
      </label>

      <label>
        Description of Miscellaneous Item
        <input
          type="text"
          name="description"
          value={formData.description || ""}
          onChange={handleInputChange}
          placeholder="Enter description"
        />
      </label>

      <label>
        Category
        <input
          type="text"
          name="category"
          value={formData.category || ""}
          onChange={handleInputChange}
          placeholder="e.g., Personal, Professional, Other"
        />
      </label>

      <label>
        Status
        <div className="personal-custom-dropdown" ref={dropdownRefs.status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() =>
              setDropdownStates((prev) => ({
                ...prev,
                status: !prev.status,
                nominee: false,
              }))
            }
          >
            {formData.status === "true"
              ? "Active"
              : formData.status === "false"
              ? "Inactive"
              : "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.status && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((status) => (
                <li
                  key={status}
                  onClick={(e) => handleSelect("status", status, e)}
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
            onClick={() =>
              setDropdownStates((prev) => ({
                ...prev,
                nominee: !prev.nominee,
                status: false,
              }))
            }
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
                  onClick={(e) =>
                    handleSelect(
                      "nomineeContact",
                      contact.email || contact.name,
                      e
                    )
                  }
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
            <img
              src={uploadIcon}
              alt="Upload"
              className="personal-upload-icon"
            />
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
        <button className="personal-btn-cancel" onClick={handleCloseModal}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MiscellaneousPopup;

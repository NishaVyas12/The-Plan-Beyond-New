import React, { useState, useRef, useEffect } from "react";

const IdsPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  // handleSubmit,
  documentTypes,
  uploadIcon,
  handleCloseModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (type) => {
    handleInputChange({ target: { name: "type", value: type } });
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("document_type", formData.type);
    form.append("document_number", formData.number);
    form.append("expirationDate", formData.expirationDate || "");
    form.append("stateIssued", formData.stateIssued || "");
    form.append("countryIssued", formData.countryIssued || "");
    form.append("location", formData.location || "");
    form.append("notes", formData.notes || "");
    if (formData.file) {
      form.append("filePath", formData.file);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ids`, {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const result = await res.json();

      if (result.success) {
        console.log("Document uploaded:", result.document);
        handleCloseModal();
      } else {
        alert(result.message || "Failed to save document.");
      }
    } catch (err) {
      console.error("Error submitting ID form:", err);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>IDs and Vital Documentation</h2>

      <label>
        Type of document or ID
        <div className="personal-custom-dropdown" ref={dropdownRef}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {formData.type || "Select a document type"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {isDropdownOpen && (
            <ul className="personal-dropdown-menu">
              {documentTypes.map((type) => (
                <li
                  key={type}
                  onClick={() => handleSelect(type)}
                  className="personal-dropdown-option"
                >
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {formData.type && (
        <>
          {["Driver’s License", "Passport"].includes(formData.type) && (
            <label>
              Expiration Date
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate || ""}
                onChange={handleInputChange}
                placeholder="Select expiration date"
              />
            </label>
          )}
          {formData.type === "Driver’s License" && (
            <label>
              State Issued
              <input
                type="text"
                name="stateIssued"
                value={formData.stateIssued || ""}
                onChange={handleInputChange}
                placeholder="Enter state issued"
              />
            </label>
          )}
          {formData.type === "Passport" && (
            <label>
              Country Issued
              <input
                type="text"
                name="countryIssued"
                value={formData.countryIssued || ""}
                onChange={handleInputChange}
                placeholder="Enter country issued"
              />
            </label>
          )}
          <label>
            {formData.type === "Social Security Card"
              ? "Social Security Number"
              : `${formData.type} Number`}
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleInputChange}
              placeholder={`Enter the ${formData.type} number`}
            />
          </label>
          <label>
            Location of {formData.type}
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter the physical location or specify a file name for digital access."
            />
          </label>
        </>
      )}

      <label>
        Upload a scan or photo of document or ID
        <div className="personal-file-upload">
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-input"
            accept="image/jpeg,image/png,application/pdf,image/gif"
          />
          <label htmlFor="file-input">
            <img
              src={uploadIcon}
              alt="Upload"
              className="personal-upload-icon"
            />
            <span style={{ color: "var(--secondary-color)" }}>
              Drag and drop Files
            </span>
            <span style={{ color: "#6B7483" }}>OR</span>
            <span style={{ color: "var(--secondary-color)" }}>
              Browse Files
            </span>
          </label>
          {formData.file && (
            <div className="personal-file-list">
              <div className="personal-file-item">
                <span>{formData.file.name}</span>
              </div>
            </div>
          )}
        </div>
      </label>

      <label>
        Notes & Instructions
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Enter any relevant details or instructions regarding the ID."
        />
      </label>

      <div className="personal-button-group">
        <button type="submit">Save</button>
        <button
          type="button"
          className="personal-btn-cancel"
          onClick={handleCloseModal}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default IdsPopup;
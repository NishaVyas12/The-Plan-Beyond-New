import React, { useState, useRef, useEffect } from "react";

const DegreesPopup = ({
  formData,
  handleInputChange,
  nomineeContacts,
  handleCloseModal,
  handleFileChange,
  // handleSubmit,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    nominee: false,
    completion_status: false,
  });
  const dropdownRefs = {
    nominee: useRef(null),
    completion_status: useRef(null),
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      });

      if (formData.file) {
        form.append("document", formData.file);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/degrees`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        alert("Employment details saved successfully.");
        handleCloseModal(); // close the popup
      } else {
        console.error("Error response:", result);
        alert("Failed to save details.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred while submitting the form.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "degrees").label}</h2>

      <label>
        School/University
        <input
          type="text"
          name="university_name"
          value={formData.university_name || ""}
          onChange={handleInputChange}
          placeholder="Enter the name of the school or university"
          required
        />
      </label>

      <label>
        Degree
        <input
          type="text"
          name="degree"
          value={formData.degree || ""}
          onChange={handleInputChange}
          placeholder="Enter the degree earned (e.g., B.Sc., M.A.)"
          required
        />
      </label>

      <label>
        Field of Study
        <input
          type="text"
          name="degree_field"
          value={formData.degree_field || ""}
          onChange={handleInputChange}
          placeholder="Enter the field of study (e.g., Computer Science)"
        />
      </label>

      <label>
        Degree Type
        <input
          type="text"
          name="degree_type"
          value={formData.degree_type || ""}
          onChange={handleInputChange}
          placeholder="e.g., Undergraduate, Postgraduate, Diploma"
        />
      </label>

      <label>
        Start Date
        <input
          type="date"
          name="degree_start"
          value={formData.degree_start || ""}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        End Date
        <input
          type="date"
          name="degree_end"
          value={formData.degree_end || ""}
          onChange={handleInputChange}
          required
        />
      </label>

      <label>
        Grade
        <input
          type="text"
          name="grade"
          value={formData.grade || ""}
          onChange={handleInputChange}
          placeholder="Enter your grade or GPA (e.g., 3.8/4.0)"
        />
      </label>

      <label>
        Completion Status
        <div className="personal-custom-dropdown" ref={dropdownRefs.completion_status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, completion_status: !prev.completion_status, nominee: false }))}
          >
            {formData.completion_status === "true" ? "Completed" : formData.completion_status === "false" ? "In Progress" : "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.completion_status && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((status) => (
                <li
                  key={status}
                  onClick={(e) => handleSelect("completion_status", status, e)}
                  className="personal-dropdown-option"
                >
                  {status === "true" ? "Completed" : "In Progress"}
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, completion_status: false }))}
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
        Activities and Societies
        <textarea
          name="activities"
          value={formData.activities || ""}
          onChange={handleInputChange}
          placeholder="List any relevant activities or societies (e.g., Debate Club, IEEE)"
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

export default DegreesPopup;
import React, { useState, useRef, useEffect } from "react";

const EmploymentPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleCloseModal,
  nomineeContacts,
  handleSubmit,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    status: false,
    nominee: false,
    employmentType: false,
    benefits: false,
  });
  const [useCustomContact, setUseCustomContact] = useState(false);
  const dropdownRefs = {
    status: useRef(null),
    nominee: useRef(null),
    employmentType: useRef(null),
    benefits: useRef(null),
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setUseCustomContact(true);
      handleInputChange({ target: { name: "nomineeContact", value: "" } });
    } else {
      setUseCustomContact(false);
      handleInputChange(e);
    }
    setDropdownStates((prev) => ({ ...prev, nominee: false }));
  };

  const handleSelect = (dropdownKey, name, value) => {
    handleInputChange({ target: { name, value } });
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
      <h2>{categories.find(c => c.id === 'employment').label}</h2>

      <label>
        Choose your employment status
        <div className="personal-custom-dropdown" ref={dropdownRefs.status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, status: !prev.status, nominee: false, employmentType: false, benefits: false }))}
          >
            {formData.type || "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.status && (
            <ul className="personal-dropdown-menu">
              {["Work for a company", "Self-employed", "Retired", "Other"].map((type) => (
                <li
                  key={type}
                  onClick={() => handleSelect("status", "type", type)}
                  className="personal-dropdown-option"
                >
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {(formData.type === "Work for a company" || formData.type === "Retired") && (
        <>
          <label>
            {formData.type === "Retired" ? "Last Place of work" : "Name of organisation"}
            <input
              type="text"
              name="organisation"
              value={formData.organisation || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Date and year of joining the organisation
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Date and year of leaving the organisation
            <input
              type="date"
              name="leavingDate"
              value={formData.leavingDate || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Supervisor and HR manager contact Info
            <input
              type="text"
              name="supervisorContact"
              value={formData.supervisorContact || ""}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Nominee Contact
            {useCustomContact ? (
              <input
                type="text"
                name="nomineeContact"
                value={formData.nomineeContact}
                onChange={handleInputChange}
              />
            ) : (
              <div className="personal-custom-dropdown" ref={dropdownRefs.nominee}>
                <div
                  className="personal-dropdown-toggle"
                  onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, status: false, employmentType: false, benefits: false }))}
                >
                  {formData.nomineeContact || "Select a nominee"}
                  <span className="personal-dropdown-arrow">▾</span>
                </div>
                {dropdownStates.nominee && (
                  <ul className="personal-dropdown-menu">
                    <li
                      key="custom"
                      onClick={() => handleContactChange({ target: { name: "nomineeContact", value: "custom" } })}
                      className="personal-dropdown-option"
                    >
                      Custom
                    </li>
                    {nomineeContacts.map((contact) => (
                      <li
                        key={contact.id}
                        onClick={() => handleContactChange({ target: { name: "nomineeContact", value: contact.email || contact.name } })}
                        className="personal-dropdown-option"
                      >
                        {contact.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </label>

          {formData.type === "Work for a company" && (
            <label>
              Are you a full-time or part-time?
              <div className="personal-custom-dropdown" ref={dropdownRefs.employmentType}>
                <div
                  className="personal-dropdown-toggle"
                  onClick={() => setDropdownStates((prev) => ({ ...prev, employmentType: !prev.employmentType, status: false, nominee: false, benefits: false }))}
                >
                  {formData.employmentType || "Select type"}
                  <span className="personal-dropdown-arrow">▾</span>
                </div>
                {dropdownStates.employmentType && (
                  <ul className="personal-dropdown-menu">
                    {["Full-time", "Part-time"].map((type) => (
                      <li
                        key={type}
                        onClick={() => handleSelect("employmentType", "employmentType", type)}
                        className="personal-dropdown-option"
                      >
                        {type}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>
          )}
          <label>
            Job Title
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Employment ID
            <input
              type="text"
              name="employmentId"
              value={formData.employmentId || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Employment Benefits
            <div className="personal-custom-dropdown" ref={dropdownRefs.benefits}>
              <div
                className="personal-dropdown-toggle"
                onClick={() => setDropdownStates((prev) => ({ ...prev, benefits: !prev.benefits, status: false, nominee: false, employmentType: false }))}
              >
                {formData.benefitsType || "Select benefit type"}
                <span className="personal-dropdown-arrow">▾</span>
              </div>
              {dropdownStates.benefits && (
                <ul className="personal-dropdown-menu">
                  {["PF number", "ESOP", "Annual Bonus", "Other"].map((type) => (
                    <li
                      key={type}
                      onClick={() => handleSelect("benefits", "benefitsType", type)}
                      className="personal-dropdown-option"
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          {formData.benefitsType && formData.benefitsType !== "" && (
            <label>
              Benefits Details
              <input
                type="text"
                name="benefitsDetails"
                value={formData.benefitsDetails || ""}
                onChange={handleInputChange}
              />
            </label>
          )}
        </>
      )}

      {formData.type === "Self-employed" && (
        <>
          <label>
            Name of organisation
            <input
              type="text"
              name="organisation"
              value={formData.organisation || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Date and year of joining the organisation
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Job Title
            <input
              type="text"
              name="jobTitle"
              value={formData.jobTitle || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Nominee Contact
            {useCustomContact ? (
              <input
                type="text"
                name="nomineeContact"
                value={formData.nomineeContact}
                onChange={handleInputChange}
              />
            ) : (
              <div className="personal-custom-dropdown" ref={dropdownRefs.nominee}>
                <div
                  className="personal-dropdown-toggle"
                  onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, status: false, employmentType: false, benefits: false }))}
                >
                  {formData.nomineeContact || "Select a nominee"}
                  <span className="personal-dropdown-arrow">▾</span>
                </div>
                {dropdownStates.nominee && (
                  <ul className="personal-dropdown-menu">
                    <li
                      key="custom"
                      onClick={() => handleContactChange({ target: { name: "nomineeContact", value: "custom" } })}
                      className="personal-dropdown-option"
                    >
                      Custom
                    </li>
                    {nomineeContacts.map((contact) => (
                      <li
                        key={contact.id}
                        onClick={() => handleContactChange({ target: { name: "nomineeContact", value: contact.email || contact.name } })}
                        className="personal-dropdown-option"
                      >
                        {contact.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </label>
        </>
      )}

      {formData.type === "Other" && (
        <>
          <label>
            Other Employment Status
            <input
              type="text"
              name="otherStatus"
              value={formData.otherStatus || ""}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Name of organisation (if applicable)
            <input
              type="text"
              name="organisation"
              value={formData.organisation || ""}
              onChange={handleInputChange}
            />
          </label>
          {formData.organisation && (
            <>
              <label>
                Date and year of joining the organisation
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate || ""}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Date and year of leaving the organisation
                <input
                  type="date"
                  name="leavingDate"
                  value={formData.leavingDate || ""}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Job Title
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle || ""}
                  onChange={handleInputChange}
                />
              </label>
            </>
          )}
        </>
      )}

      <label>
        Upload a Scan or Photo of the Document
        <div className="personal-file-upload">
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-input"
            accept="image/jpeg,image/png,application/pdf,image/gif"
            multiple
          />
          <label htmlFor="file-input">
            <img src={uploadIcon} alt="Upload" className="personal-upload-icon" />
            <span style={{ color: "var(--secondary-color)" }}>Drag and drop Files</span>
            <span style={{ color: "#6B7483" }}>OR</span>
            <span style={{ color: "var(--secondary-color)" }}>Browse Files</span>
          </label>
          {formData.files && (
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

// Static handleSubmit for integration with PersonalInfo
EmploymentPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const form = new FormData();
  form.append("type", formData.type);
  form.append("organisation", formData.organisation || "");
  form.append("joiningDate", formData.joiningDate || "");
  form.append("leavingDate", formData.leavingDate || "");
  form.append("supervisorContact", formData.supervisorContact || "");
  form.append("nomineeContact", formData.nomineeContact || "");
  form.append("employmentType", formData.employmentType || "");
  form.append("jobTitle", formData.jobTitle || "");
  form.append("employmentId", formData.employmentId || "");
  form.append("benefitsType", formData.benefitsType || "");
  form.append("benefitsDetails", formData.benefitsDetails || "");
  form.append("otherStatus", formData.otherStatus || "");
  form.append("notes", formData.notes || "");
  if (formData.files) {
    Array.from(formData.files).forEach(file => {
      form.append("employmentFiles", file);
    });
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employment`, {
      method: "POST",
      credentials: "include",
      body: form,
    });

    const result = await res.json();

    if (result.success) {
      return { success: true, message: "Employment details saved successfully!", documentId: result.documentId };
    } else {
      return { success: false, message: result.message || "Failed to save employment details." };
    }
  } catch (err) {
    console.error("Error submitting employment form:", err);
    return { success: false, message: "An unexpected error occurred." };
  }
};

export default EmploymentPopup;
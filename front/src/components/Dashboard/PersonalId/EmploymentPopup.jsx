import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select';
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const EmploymentPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleCloseModal,
  nomineeContacts,
  allContacts,
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
  const dropdownRefs = {
    status: useRef(null),
    nominee: useRef(null),
    employmentType: useRef(null),
    benefits: useRef(null),
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: 'none',
      fontSize: '14px',
      lineHeight: '20px',
      padding: '5px',
      backgroundColor: '#fff',
      '&:hover': {
        border: '1px solid #aaa',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#f0f0f0' : state.isFocused ? '#e6e6e6' : '#fff',
      color: '#333',
      padding: '10px',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: '#e6e6e6',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#333',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#999',
    }),
  };

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const handleRemoveFile = (index, isExisting = false) => {
    if (isExisting) {
      const updatedExistingFiles = formData.existingFiles.filter((_, i) => i !== index);
      handleInputChange({ target: { name: "existingFiles", value: updatedExistingFiles } });
    } else {
      const updatedFiles = Array.from(formData.files || []).filter((_, i) => i !== index);
      handleInputChange({ target: { name: "files", value: updatedFiles.length ? updatedFiles : null } });
    }
  };

  const handleFileChangeWrapper = (e) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0) {
      const existingFilesArray = Array.from(formData.files || []);
      const combinedFiles = [...existingFilesArray, ...Array.from(newFiles)];
      handleFileChange({ target: { files: combinedFiles } });
    }
  };

  const handleContactChange = (name, selected) => {
    handleInputChange({ target: { name, value: selected ? selected.value : "" } });
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
            <Select
              name="supervisorContact"
              options={allContacts}
              value={allContacts.find(option => option.value === formData.supervisorContact) || null}
              onChange={(selected) => handleContactChange("supervisorContact", selected)}
              placeholder="Select Supervisor/HR Contact"
              styles={selectStyles}
              isSearchable
              aria-label="Supervisor/HR contact"
            />
          </label>

          <label>
            Nominee Contact
            <Select
              name="nomineeContact"
              options={nomineeContacts}
              value={nomineeContacts.find(option => option.value === formData.nomineeContact) || null}
              onChange={(selected) => handleContactChange("nomineeContact", selected)}
              placeholder="Select a nominee"
              styles={selectStyles}
              isSearchable
              aria-label="Nominee contact"
            />
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

      {(formData.type === "Self-employed") && (
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
            <Select
              name="nomineeContact"
              options={nomineeContacts}
              value={nomineeContacts.find(option => option.value === formData.nomineeContact) || null}
              onChange={(selected) => handleContactChange("nomineeContact", selected)}
              placeholder="Select a nominee"
              styles={selectStyles}
              isSearchable
              aria-label="Nominee contact"
            />
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
            onChange={handleFileChangeWrapper}
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
          {(formData.existingFiles?.length > 0 || formData.files?.length > 0) && (
            <div className="personal-file-list">
              {formData.existingFiles?.length > 0 && formData.existingFiles.map((file, index) => (
                <div key={`existing-${index}`} className="personal-file-item">
                  <div className="personal-file-image-container">
                    {isImageFile(file.name) ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${file.path}`}
                        alt={file.name}
                        className="personal-file-image"
                      />
                    ) : (
                      <>
                        <img
                          src={pdfIcon}
                          alt="PDF Icon"
                          className="personal-document-icon"
                          style={{ width: '24px', height: '24px' }}
                        />
                        <span>{file.name}</span>
                      </>
                    )}
                    <button
                      type="button"
                      className="personal-file-remove"
                      onClick={() => handleRemoveFile(index, true)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {formData.files && Array.from(formData.files).map((file, index) => (
                <div key={`new-${index}`} className="personal-file-item">
                  <div className="personal-file-image-container">
                    {isImageFile(file.name) ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="personal-file-image"
                      />
                    ) : (
                      <>
                        <img
                          src={pdfIcon}
                          alt="PDF Icon"
                          className="personal-document-icon"
                          style={{ width: '24px', height: '24px' }}
                        />
                        <span>{file.name}</span>
                      </>
                    )}
                    <button
                      type="button"
                      className="personal-file-remove"
                      onClick={() => handleRemoveFile(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </label>

       <label>
          Add Folder
        <div className="family-detail-card-upload">

          <img src={uploadIcon} alt="Upload Icon" className="family-upload-icon" />
          <div className="upload-text-group">
            <p>Drag and drop files here</p>
            <p>OR</p>
            <p>Browse files</p>
          </div>
          <input
            type="file"
            // name={fieldName}
            className="family-detail-card-input"
          // onChange={handleFileChange}
          // multiple={'new_folder_documents'}
          />
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

// Static handleSubmit for integration with PersonalInfo (unchanged)
EmploymentPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, type, organisation, joiningDate, leavingDate, supervisorContact, nomineeContact, employmentType, jobTitle, employmentId, benefitsType, benefitsDetails, otherStatus, notes, files, existingFiles = [] } = formData;

  if (!type) {
    return { success: false, message: "Employment status is required." };
  }

  const form = new FormData();
  form.append("type", type);
  form.append("organisation", organisation || "");
  form.append("joiningDate", joiningDate || "");
  form.append("leavingDate", leavingDate || "");
  form.append("supervisorContact", supervisorContact || "");
  form.append("nomineeContact", nomineeContact || "");
  form.append("employmentType", employmentType || "");
  form.append("jobTitle", jobTitle || "");
  form.append("employmentId", employmentId || "");
  form.append("benefitsType", benefitsType || "");
  form.append("benefitsDetails", benefitsDetails || "");
  form.append("otherStatus", otherStatus || "");
  form.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach(file => {
      form.append("employmentFiles", file);
    });
  } else if (existingFiles.length === 0) {
    form.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/employment/${id}`
      : `${import.meta.env.VITE_API_URL}/api/employment`;

    const res = await fetch(url, {
      method,
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
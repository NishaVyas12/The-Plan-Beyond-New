import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select'; // Add react-select import
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const MilitaryPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleRemoveFile,
  handleSubmit,
  nomineeContacts,
  handleCloseModal,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    military_branch: false,
    service_status: false,
    // Removed nominee from dropdownStates as it uses react-select
  });
  const dropdownRefs = {
    military_branch: useRef(null),
    service_status: useRef(null),
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

  const branchOptions = ['Army', 'Navy', 'Air Force', 'Others'];

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const handleSelect = (name, value, event) => {
    event.stopPropagation();
    handleInputChange({ target: { name, value } });
    setDropdownStates((prev) => ({ ...prev, [name]: false }));
  };

  const handleContactChange = (selected) => {
    handleInputChange({ target: { name: "nomineeContact", value: selected ? selected.value : "" } });
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
    <form onSubmit={(e) => handleSubmit(e, MilitaryPopup.handleSubmit)} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "military").label}</h2>

      <label>
        Which branch did you serve?
        <div className="personal-custom-dropdown" ref={dropdownRefs.military_branch}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, military_branch: !prev.military_branch, service_status: false }))}
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, service_status: !prev.service_status, military_branch: false }))}
          >
            {formData.service_status === "true" ? "Active" : formData.service_status === "false" ? "Inactive" : "Select status"}
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
                  {status === "true" ? "Active" : "Inactive"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Nominee Contact
        <Select
          name="nomineeContact"
          options={nomineeContacts}
          value={nomineeContacts.find(option => option.value === formData.nomineeContact) || null}
          onChange={handleContactChange}
          placeholder="Select a nominee"
          styles={selectStyles}
          isSearchable
          aria-label="Nominee contact"
        />
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
            name="militaryFiles"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept="image/jpeg,image/png,application/pdf,image/gif"
            id="file-input"
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

// Static handleSubmit for integration with PersonalInfo (unchanged)
MilitaryPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, military_branch, military_name, military_rank, service_type, military_serve, service_status, nomineeContact, military_location, notes, files, existingFiles = [] } = formData;

  if (!military_branch) {
    return { success: false, message: "Military branch is required." };
  }

  const data = new FormData();
  data.append("military_branch", military_branch);
  data.append("military_name", military_branch === "Others" ? military_name || "" : "");
  data.append("military_rank", military_rank || "");
  data.append("service_type", service_type || "");
  data.append("military_serve", military_serve || "");
  data.append("service_status", service_status || "false");
  data.append("nomineeContact", nomineeContact || "");
  data.append("military_location", military_location || "");
  data.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach((file) => {
      data.append("militaryFiles", file);
    });
  } else if (existingFiles.length === 0) {
    data.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/military/${id}`
      : `${import.meta.env.VITE_API_URL}/api/military`;

    const res = await fetch(url, {
      method,
      credentials: "include",
      body: data,
    });

    const result = await res.json();

    if (res.ok && result.success) {
      handleCloseModal();
      return {
        success: true,
        message: id ? "Military details updated successfully." : "Military information saved successfully!",
        militaryId: result.militaryId || id,
      };
    } else {
      return { success: false, message: result.message || "Something went wrong!" };
    }
  } catch (error) {
    console.error("Error submitting military form:", error);
    return { success: false, message: "Error submitting form. Try again." };
  }
};

export default MilitaryPopup;
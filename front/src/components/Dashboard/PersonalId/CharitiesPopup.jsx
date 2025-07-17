import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select'; // Add react-select import
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const CharitiesPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  nomineeContacts,
  handleCloseModal,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    frequency: false,
    enrolled: false,
    // Removed nominee dropdown state as it's no longer needed with react-select
  });
  const dropdownRefs = {
    frequency: useRef(null),
    enrolled: useRef(null),
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

  const handleFileChangeWrapper = (e) => {
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0) {
      const existingFilesArray = Array.from(formData.files || []);
      const combinedFiles = [...existingFilesArray, ...Array.from(newFiles)];
      handleFileChange({ target: { files: combinedFiles } });
    }
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
    <form onSubmit={(e) => handleSubmit(e, CharitiesPopup.handleSubmit)} className="personal-popup-form">
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, frequency: !prev.frequency, enrolled: false }))}
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, enrolled: !prev.enrolled, frequency: false }))}
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
        Upload scans or photos of documents
        <div className="personal-file-upload">
          <input
            type="file"
            name="charityFiles"
            multiple
            onChange={handleFileChangeWrapper}
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
CharitiesPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, charity_name, charity_website, payment_method, amount, frequency, enrolled, nomineeContact, notes, files, existingFiles = [] } = formData;

  if (!charity_name) {
    return { success: false, message: "Charity name is required." };
  }

  const form = new FormData();
  form.append("charity_name", charity_name);
  form.append("charity_website", charity_website || "");
  form.append("payment_method", payment_method || "");
  form.append("amount", amount || "0");
  form.append("frequency", frequency || "");
  form.append("enrolled", enrolled || "false");
  form.append("nomineeContact", nomineeContact || "");
  form.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach((file) => {
      form.append("charityFiles", file);
    });
  } else if (existingFiles.length === 0) {
    form.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/charity/${id}`
      : `${import.meta.env.VITE_API_URL}/api/charity`;

    const res = await fetch(url, {
      method,
      credentials: "include",
      body: form,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      handleCloseModal();
      return {
        success: true,
        message: id ? "Charity details updated successfully." : "Charity information saved successfully!",
        charityId: data.charityId || id,
      };
    } else {
      return { success: false, message: data.message || "Something went wrong!" };
    }
  } catch (error) {
    console.error("Error submitting charity form:", error);
    return { success: false, message: "Error submitting form. Try again." };
  }
};

export default CharitiesPopup;
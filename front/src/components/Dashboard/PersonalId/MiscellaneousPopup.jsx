import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const MiscellaneousPopup = ({
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
    status: false,
  });
  
  const dropdownRefs = {
    status: useRef(null),
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
    <form onSubmit={(e) => handleSubmit(e, MiscellaneousPopup.handleSubmit)} className="personal-popup-form">
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
            name="miscellaneousFiles"
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
        Folder
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
MiscellaneousPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, item, description, category, status, nomineeContact, notes, files, existingFiles = [] } = formData;

  if (!item) {
    return { success: false, message: "Item name is required." };
  }

  const data = new FormData();
  data.append("item", item);
  data.append("description", description || "");
  data.append("category", category || "");
  data.append("status", status || "false");
  data.append("nomineeContact", nomineeContact || "");
  data.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach((file) => {
      data.append("miscellaneousFiles", file);
    });
  } else if (existingFiles.length === 0) {
    data.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/miscellaneous/${id}`
      : `${import.meta.env.VITE_API_URL}/api/miscellaneous`;

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
        message: id ? "Miscellaneous details updated successfully." : "Miscellaneous information saved successfully!",
        miscellaneousId: result.miscellaneousId || id,
      };
    } else {
      return { success: false, message: result.message || "Something went wrong!" };
    }
  } catch (error) {
    console.error("Error submitting miscellaneous form:", error);
    return { success: false, message: "Error submitting form. Try again." };
  }
};

export default MiscellaneousPopup;
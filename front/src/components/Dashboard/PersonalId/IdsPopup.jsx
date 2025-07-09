import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';

const IdsPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  documentTypes,
  uploadIcon,
  handleCloseModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [removeFile, setRemoveFile] = useState(false); // Track file removal
  const dropdownRef = useRef(null);

  const handleSelect = (type) => {
    handleInputChange({ target: { name: "type", value: type } });
    setIsDropdownOpen(false);
  };

  const handleRemoveFile = () => {
    setRemoveFile(true);
    setFormData((prev) => ({ ...prev, files: null, existingFiles: [] }));
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

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e, IdsPopup.handleSubmit);
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <form onSubmit={onSubmit} className="personal-popup-form">
        <h2>{formData.id ? 'Edit ID Document' : 'Add ID Document'}</h2>

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
            <label>
              {formData.type === "Social Security Card"
                ? "Social Security Number"
                : `${formData.type} Number`}
              <input
                type="text"
                name="number"
                value={formData.number || ""}
                onChange={handleInputChange}
                placeholder={`Enter the ${formData.type} number`}
                required
              />
            </label>
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
              Location of {formData.type}
              <input
                type="text"
                name="location"
                value={formData.location || ""}
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
              onChange={(e) => {
                handleFileChange(e);
                setRemoveFile(false); // Reset removeFile when new files are selected
              }}
              style={{ display: "none" }}
              id="file-input"
              accept="image/jpeg,image/png,application/pdf,image/gif"
              multiple
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
            {(formData.existingFiles?.length > 0 || formData.files) && (
              <div className="personal-file-list">
                {formData.existingFiles?.length > 0 && !removeFile && (
                  formData.existingFiles.map((file, index) => (
                    <div key={`existing-${index}`} className="personal-file-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{
                          marginLeft: '10px',
                          padding: '2px 8px',
                          backgroundColor: '#E5E7EB',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#4B5563',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
                {formData.files && Array.from(formData.files).map((file, index) => (
                  <div key={`new-${index}`} className="personal-file-item">
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </label>

        <label>
          Notes & Instructions
          <textarea
            name="notes"
            value={formData.notes || ""}
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
    </>
  );
};

IdsPopup.handleSubmit = async (e, formData, handleCloseDrawer) => {
  e.preventDefault();
  const { id, type, number, expirationDate, stateIssued, countryIssued, location, notes, files, existingFiles } = formData;

  if (!type || !number) {
    toast.error("Document Type and Number are required.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    return { success: false, message: "Document Type and Number are required." };
  }

  const form = new FormData();
  form.append("document_type", type);
  form.append("document_number", number);
  form.append("expirationDate", expirationDate || "");
  form.append("stateIssued", stateIssued || "");
  form.append("countryIssued", countryIssued || "");
  form.append("location", location || "");
  form.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach(file => {
      form.append("personalIdFiles", file);
    });
  } else if (existingFiles.length === 0) {
    form.append("removeFile", "true"); // Signal to remove the file
  }

  try {
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/ids/${id}`
      : `${import.meta.env.VITE_API_URL}/api/ids`;
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      credentials: "include",
      body: form,
    });
    const result = await response.json();
    if (result.success) {
      toast.success(id ? "Document updated successfully!" : `${type} added successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      handleCloseDrawer();
    } else {
      toast.error(result.message || "Failed to save document.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }
    return result;
  } catch (err) {
    console.error("Error submitting ID form:", err);
    toast.error("An unexpected error occurred.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    return { success: false, message: "An unexpected error occurred." };
  }
};

IdsPopup.propTypes = {
  formData: PropTypes.object.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleFileChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  documentTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  uploadIcon: PropTypes.string.isRequired,
  handleCloseModal: PropTypes.func.isRequired,
};

export default IdsPopup;
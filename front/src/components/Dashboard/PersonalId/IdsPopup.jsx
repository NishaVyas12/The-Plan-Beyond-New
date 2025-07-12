import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';
import { Country, State } from 'country-state-city';

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
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const dropdownRef = useRef(null);

  const handleSelect = (type) => {
    handleInputChange({ target: { name: "type", value: type } });
    setIsDropdownOpen(false);
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

  // Initialize countries and states
  useEffect(() => {
    const countries = Country.getAllCountries().map(country => ({
      name: country.name,
      isoCode: country.isoCode,
    }));
    setFilteredCountries(countries);

    const states = State.getAllStates().map(state => ({
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode,
    }));
    setFilteredStates(states);
  }, []);

  // Filter countries based on search
  useEffect(() => {
    const countries = Country.getAllCountries().map(country => ({
      name: country.name,
      isoCode: country.isoCode,
    }));
    if (countrySearch) {
      setFilteredCountries(
        countries.filter(country =>
          country.name.toLowerCase().includes(countrySearch.toLowerCase())
        )
      );
    } else {
      setFilteredCountries(countries);
    }
  }, [countrySearch]);

  // Filter states based on search
  useEffect(() => {
    const states = State.getAllStates().map(state => ({
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode,
    }));
    if (stateSearch) {
      setFilteredStates(
        states.filter(state =>
          state.name.toLowerCase().includes(stateSearch.toLowerCase())
        )
      );
    } else {
      setFilteredStates(states);
    }
  }, [stateSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsCountryDropdownOpen(false);
        setIsStateDropdownOpen(false);
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
              <ul className="personal-dropdown-menu personal-scrollable-dropdown">
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
                className="personal-text-input"
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
                  className="personal-text-input"
                />
              </label>
            )}
            {formData.type === "Driver’s License" && (
              <label>
                State Issued
                <div className="personal-custom-dropdown">
                  <input
                    type="text"
                    name="stateIssued"
                    value={formData.stateIssued || ""}
                    onChange={(e) => {
                      setStateSearch(e.target.value);
                      handleInputChange(e);
                    }}
                    onFocus={() => setIsStateDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsStateDropdownOpen(false), 200)}
                    placeholder="Select or type state"
                    className="personal-text-input"
                  />
                  {isStateDropdownOpen && (
                    <ul className="personal-dropdown-menu personal-scrollable-dropdown">
                      {filteredStates.map((state) => (
                        <li
                          key={`${state.isoCode}-${state.countryCode}`}
                          className="personal-dropdown-option"
                          onClick={() => {
                            handleInputChange({ target: { name: 'stateIssued', value: state.name } });
                            setStateSearch('');
                            setIsStateDropdownOpen(false);
                          }}
                        >
                          {state.name}
                        </li>
                      ))}
                      {filteredStates.length === 0 && (
                        <li className="personal-dropdown-option">
                          No states found
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </label>
            )}
            {formData.type === "Passport" && (
              <label>
                Country Issued
                <div className="personal-custom-dropdown">
                  <input
                    type="text"
                    name="countryIssued"
                    value={formData.countryIssued || ""}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      handleInputChange(e);
                    }}
                    onFocus={() => setIsCountryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 200)}
                    placeholder="Select or type country"
                    className="personal-text-input"
                  />
                  {isCountryDropdownOpen && (
                    <ul className="personal-dropdown-menu personal-scrollable-dropdown">
                      {filteredCountries.map((country) => (
                        <li
                          key={country.isoCode}
                          className="personal-dropdown-option"
                          onClick={() => {
                            handleInputChange({ target: { name: 'countryIssued', value: country.name } });
                            setCountrySearch('');
                            setIsCountryDropdownOpen(false);
                          }}
                        >
                          {country.name}
                        </li>
                      ))}
                      {filteredCountries.length === 0 && (
                        <li className="personal-dropdown-option">
                          No countries found
                        </li>
                      )}
                    </ul>
                  )}
                </div>
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
                className="personal-text-input"
              />
            </label>
          </>
        )}

        <label>
          Upload a scan or photo of document or ID
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
              <img
                src={uploadIcon}
                alt="Upload"
                className="personal-upload-icon"
              />
              <span style={{ color: "var(--secondary-color)" }}>
                Drag and drop Files
              </span>
              <span style={{ color: "#6B7483" }}>OR</span>
              <span style={ {color: "var(--secondary-color)" }}>
                Browse Files
              </span>
            </label>
            {(formData.existingFiles?.length > 0 || formData.files?.length > 0) && (
              <div className="personal-file-list">
                {formData.existingFiles?.length > 0 && (
                  formData.existingFiles.map((file, index) => (
                    <div key={`existing-${index}`} className="personal-file-item">
                      {file.path && (
                        <div className="personal-file-image-container">
                          <img
                            src={`${import.meta.env.VITE_API_URL}${file.path}`}
                            alt="Uploaded file"
                            className="personal-file-image"
                          />
                          <button
                            type="button"
                            className="personal-file-remove"
                            onClick={() => handleRemoveFile(index, true)}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {formData.files && Array.from(formData.files).map((file, index) => (
                  <div key={`new-${index}`} className="personal-file-item">
                    <div className="personal-file-image-container">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Uploaded file"
                        className="personal-file-image"
                      />
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
  const { id, type, number, expirationDate, stateIssued, countryIssued, location, notes, files, existingFiles = [] } = formData;

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
    form.append("removeFile", "true");
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
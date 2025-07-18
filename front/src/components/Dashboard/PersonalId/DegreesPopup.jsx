import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select'; // Add react-select import
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const DegreesPopup = ({
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
    completion_status: false,
    // Removed nominee from dropdownStates as it uses react-select
  });
  const dropdownRefs = {
    completion_status: useRef(null),
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
    <form onSubmit={(e) => handleSubmit(e, DegreesPopup.handleSubmit)} className="personal-popup-form">
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
            onClick={() => setDropdownStates((prev) => ({ ...prev, completion_status: !prev.completion_status }))}
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
            name="degreeFiles"
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
DegreesPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, university_name, degree, degree_field, degree_type, degree_start, degree_end, grade, completion_status, nomineeContact, activities, notes, files, existingFiles = [] } = formData;

  if (!university_name || !degree) {
    return { success: false, message: "University name and degree are required." };
  }

  const data = new FormData();
  data.append("university_name", university_name);
  data.append("degree", degree);
  data.append("degree_field", degree_field || "");
  data.append("degree_type", degree_type || "");
  data.append("degree_start", degree_start || "");
  data.append("degree_end", degree_end || "");
  data.append("grade", grade || "");
  data.append("completion_status", completion_status || "false");
  data.append("nomineeContact", nomineeContact || "");
  data.append("activities", activities || "");
  data.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach((file) => {
      data.append("degreeFiles", file);
    });
  } else if (existingFiles.length === 0) {
    data.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/degrees/${id}`
      : `${import.meta.env.VITE_API_URL}/api/degrees`;

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
        message: id ? "Degree details updated successfully." : "Degree information saved successfully!",
        degreeId: result.degreeId || id,
      };
    } else {
      return { success: false, message: result.message || "Something went wrong!" };
    }
  } catch (error) {
    console.error("Error submitting degree form:", error);
    return { success: false, message: "Error submitting form. Try again." };
  }
};

export default DegreesPopup;
import React, { useState, useRef, useEffect } from "react";
import Select from 'react-select';
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';

const ClubsPopup = ({
  formData,
  handleInputChange,
  handleFileChange,
  handleRemoveFile,
  handleSubmit,
  allContacts,
  nomineeContacts,
  handleCloseModal,
  categories,
  uploadIcon,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    club: false,
    membership_status: false,
  });
  const dropdownRefs = {
    club: useRef(null),
    membership_status: useRef(null), // Fixed: Added missing closing parenthesis
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

  const handleContactChange = (name, selected) => {
    handleInputChange({ target: { name, value: selected ? selected.value : "" } });
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

  const organizationOptions = [
    'Gymkhana Clubs',
    'Rotary Club of India',
    'Lions Club International – India Chapters',
    'Round Table India',
    'Inner Wheel Club (women’s wing of Rotary)',
    'Toastmasters India',
    'Jaycees India (JCI)',
    'Others'
  ];

  return (
    <form onSubmit={(e) => handleSubmit(e, ClubsPopup.handleSubmit)} className="personal-popup-form">
      <h2>{categories.find((c) => c.id === "clubs").label}</h2>

      <label>
        Name of Organization
        <div className="personal-custom-dropdown" ref={dropdownRefs.club}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, club: !prev.club, membership_status: false }))}
          >
            {formData.club || "Select organization"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.club && (
            <ul className="personal-dropdown-menu">
              {organizationOptions.map((option) => (
                <li
                  key={option}
                  onClick={(e) => handleSelect("club", option, e)}
                  className="personal-dropdown-option"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      {formData.club === "Others" && (
        <label>
          Specify Organization Name
          <input
            type="text"
            name="club_name"
            value={formData.club_name || ""}
            onChange={handleInputChange}
            placeholder="Enter the organization name"
            required
          />
        </label>
      )}

      <label>
        Organization Contact Info
        <Select
          name="club_contact"
          options={allContacts}
          value={allContacts.find(option => option.value === formData.club_contact) || null}
          onChange={(selected) => handleContactChange("club_contact", selected)}
          placeholder="Select contact info"
          styles={selectStyles}
          isSearchable
          aria-label="Organization contact"
        />
      </label>

      <label>
        Membership Type
        <input
          type="text"
          name="membership_type"
          value={formData.membership_type || ""}
          onChange={handleInputChange}
          placeholder="e.g., Regular, Lifetime, Honorary"
        />
      </label>

      <label>
        Membership Status
        <div className="personal-custom-dropdown" ref={dropdownRefs.membership_status}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, membership_status: !prev.membership_status, club: false }))}
          >
            {formData.membership_status === "true" ? "Active" : formData.membership_status === "false" ? "Inactive" : "Select status"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.membership_status && (
            <ul className="personal-dropdown-menu">
              {["false", "true"].map((status) => (
                <li
                  key={status}
                  onClick={(e) => handleSelect("membership_status", status, e)}
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
          onChange={(selected) => handleContactChange("nomineeContact", selected)}
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
            name="clubFiles"
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
ClubsPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, club, club_name, club_contact, membership_type, membership_status, nomineeContact, notes, files, existingFiles = [] } = formData;

  if (!club) {
    return { success: false, message: "Club name is required." };
  }
  if (club === "Others" && !club_name) {
    return { success: false, message: "Specify organization name is required when 'Others' is selected." };
  }

  const data = new FormData();
  data.append("club", club);
  data.append("club_name", club === "Others" ? club_name : "");
  data.append("club_contact", club_contact || "");
  data.append("membership_type", membership_type || "");
  data.append("membership_status", membership_status || "false");
  data.append("nomineeContact", nomineeContact || "");
  data.append("notes", notes || "");
  if (files) {
    Array.from(files).forEach((file) => {
      data.append("clubFiles", file);
    });
  } else if (existingFiles.length === 0) {
    data.append("removeFile", "true");
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/club/${id}`
      : `${import.meta.env.VITE_API_URL}/api/club`;

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
        message: id ? "Club details updated successfully." : "Club information saved successfully!",
        clubId: result.clubId || id,
      };
    } else {
      return { success: false, message: result.message || "Something went wrong!" };
    }
  } catch (error) {
    console.error("Error submitting club form:", error);
    return { success: false, message: "Error submitting form. Try again." };
  }
};

export default ClubsPopup;
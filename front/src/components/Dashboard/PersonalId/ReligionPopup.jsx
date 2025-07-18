import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import Select from 'react-select'; // Add react-select import
import 'react-toastify/dist/ReactToastify.css';

const ReligionPopup = ({
  formData,
  handleInputChange,
  nomineeContacts,
  handleSubmit,
  categories,
  uploadIcon,
  handleCloseModal,
}) => {
  const [dropdownStates, setDropdownStates] = useState({
    religion: false,
    nominee: false,
  });
  const dropdownRefs = {
    religion: useRef(null),
    nominee: useRef(null),
  };

  // Add selectStyles to match EmploymentPopup
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

  const handleSelect = (name, value, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    handleInputChange({ target: { name, value } });
    // Map the input name to the corresponding dropdown state key
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

  return (
    <form onSubmit={handleSubmit} className="personal-popup-form">
      <h2>{formData.id ? 'Edit Religion' : 'Add Religion'}</h2>

      <label>
        Select your religion
        <div className="personal-custom-dropdown" ref={dropdownRefs.religion}>
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, religion: !prev.religion, nominee: false }))}
          >
            {formData.religion || "Select religion"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.religion && (
            <ul className="personal-dropdown-menu">
              {["Hindu", "Muslim", "Sikh", "Christian", "Jain", "Buddhist", "Others"].map((religion) => (
                <li
                  key={religion}
                  onClick={(e) => handleSelect("religion", religion, e)}
                  className="personal-dropdown-option"
                >
                  {religion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label>
        Nominee Contact
        <div className="personal-custom-dropdown" ref={dropdownRefs.nominee}>
          <Select
            name="nomineeContact"
            options={nomineeContacts}
            value={nomineeContacts.find(option => option.value === formData.nomineeContact) || null}
            onChange={(selected) => handleSelect("nomineeContact", selected ? selected.value : "")}
            placeholder="Select a nominee"
            styles={selectStyles}
            isSearchable
            aria-label="Nominee contact"
          />
        </div>
      </label>

      {formData.religion === "Others" && (
        <label>
          Specify other religion
          <input
            type="text"
            name="religion1"
            value={formData.religion1 || ""}
            onChange={handleInputChange}
            required
          />
        </label>
      )}

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


      <div className="personal-button-group">
        <button type="submit">Save</button>
        <button className="personal-btn-cancel" onClick={handleCloseModal}>Cancel</button>
      </div>
    </form>
  );
};

// Static handleSubmit for integration with PersonalInfoDetails (unchanged)
ReligionPopup.handleSubmit = async (e, formData, handleCloseModal) => {
  e.preventDefault();

  const { id, religion, religion1, nomineeContact } = formData;

  if (!religion) {
    toast.error("Religion is required.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    return { success: false, message: "Religion is required." };
  }

  if (religion === "Others" && !religion1) {
    toast.error("Please specify the other religion.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    return { success: false, message: "Please specify the other religion." };
  }

  const payload = {
    religion,
    religion1: religion === "Others" ? religion1 : "",
    nomineeContact: nomineeContact || "",
  };

  try {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/religion/${id}`
      : `${import.meta.env.VITE_API_URL}/api/religion`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return { success: true, message: "Religion information saved successfully.", religionId: data.religionId };
    } else {
      toast.error(data.message || "Something went wrong. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return { success: false, message: data.message || "Something went wrong." };
    }
  } catch (err) {
    console.error("Error submitting religion data:", err);
    toast.error("Failed to save religion info.", {
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

export default ReligionPopup;
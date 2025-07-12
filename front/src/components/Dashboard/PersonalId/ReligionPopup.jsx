import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const ReligionPopup = ({
  formData,
  handleInputChange,
  nomineeContacts,
  handleSubmit,
  categories,
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

  const handleSelect = (name, value, event) => {
    event.preventDefault();
    event.stopPropagation();
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
          <div
            className="personal-dropdown-toggle"
            onClick={() => setDropdownStates((prev) => ({ ...prev, nominee: !prev.nominee, religion: false }))}
          >
            {formData.nomineeContact || "Select a nominee"}
            <span className="personal-dropdown-arrow">▾</span>
          </div>
          {dropdownStates.nominee && (
            <ul className="personal-dropdown-menu">
              <li
                key="default"
                onClick={(e) => handleSelect("nomineeContact", "", e)}
                className="personal-dropdown-option"
              >
                Select a nominee
              </li>
              {nomineeContacts.map((contact) => (
                <li
                  key={contact.id}
                  onClick={(e) => handleSelect("nomineeContact", contact.email || contact.name, e)}
                  className="personal-dropdown-option"
                >
                  {contact.name}
                </li>
              ))}
            </ul>
          )}
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

      <div className="personal-button-group">
        <button type="submit">Save</button>
        <button className="personal-btn-cancel" onClick={handleCloseModal}>Cancel</button>
      </div>
    </form>
  );
};

// Static handleSubmit for integration with PersonalInfoDetails
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
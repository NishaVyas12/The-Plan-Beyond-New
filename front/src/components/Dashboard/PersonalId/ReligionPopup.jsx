import React, { useState, useRef, useEffect } from "react";

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
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation(); // Prevent event from bubbling up
    handleInputChange({ target: { name, value } });
    setDropdownStates((prev) => {
      const newState = { ...prev, [name]: false };
      return newState; // Explicitly return new state
    });
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
      <h2>{categories.find(c => c.id === 'religion').label}</h2>

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
                  onClick={(e) => {
                    handleSelect("nomineeContact", contact.email || contact.name, e);
                    setDropdownStates((prev) => ({ ...prev, nominee: false })); // Force close
                  }}
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

export default ReligionPopup;
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "./Nominee.css";
import Select from "react-select";
import "react-phone-input-2/lib/style.css";
import "react-toastify/dist/ReactToastify.css";

const NomineeCard = ({
  id,
  type,
  firstName = "",
  middleName = "",
  lastName = "",
  email = "",
  phone_number = "",
  phone_number1 = "",
  phone_number2 = "",
  category = "",
  relation = "",
  profileImage = "",
  onEdit,
  onRemove,
  onImageUpload,
  isEmpty,
}) => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Not Assigned";

  const handleViewAssets = () => {
    if (isEmpty) return;
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleImageUpload = async (event) => {
    if (isEmpty) return;
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("nomineeId", id);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nominees/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        onImageUpload({ id, imagePath: data.imagePath });
        toast.success("Profile image uploaded successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to upload image.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error uploading image. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPopupOpen) {
        closePopup();
      }
    };

    if (isPopupOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPopupOpen]);

  const relationshipDisplay = category
    ? category === "Family" && relation
      ? `${category} (${relation})`
      : category
    : "-";

  const handleOptionClick = (action) => {
    switch (action) {
      case "Edit":
        onEdit({
          id,
          type,
          firstName,
          middleName,
          lastName,
          email,
          phone_number,
          phone_number1,
          phone_number2,
          category,
          relation,
          profileImage,
        });
        break;
      case "Delete":
        onRemove(id);
        break;
      case "View Assets":
        handleViewAssets();
        break;
      default:
        break;
    }
    setShowOptions(false);
  };

  return (
    <div className="nominee-add-card-add-nominee">
      <div className="nominee-add-card-content-add-nominee">
        <div className="nominee-add-avatar-wrapper-add-nominee">
          <div
            className="nominee-add-avatar-add-nominee"
            style={
              profileImage
                ? {
                    backgroundImage: `url(${import.meta.env.VITE_API_URL}${profileImage.startsWith("/") ? "" : "/"}${profileImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {}
            }
          >
            <label htmlFor={`avatar-upload-${id}`} className="nominee-add-avatar-upload">
              <FaCamera className="nominee-add-camera-icon" />
              <input
                type="file"
                id={`avatar-upload-${id}`}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                disabled={isEmpty}
              />
            </label>
          </div>
        </div>
        <div className="nominee-add-details-add-nominee">
          <div className="nominee-add-name-relation-add-nominee">
            <div>
              <h3 className="nominee-add-name-add-nominee">{fullName}</h3>
              <p className="nominee-add-type-add-nominee">{type || "No Type Assigned"}</p>
              <p className="nominee-add-info-add-nominee">{relationshipDisplay}</p>
            </div>
            <div
              className="nominee-add-options-add-nominee"
              onClick={() => setShowOptions(!showOptions)}
            >
              ...
              {showOptions && (
                <div className="nominee-add-options-menu-add-nominee">
                  <button
                    className="nominee-add-option-add-nominee"
                    onClick={() => handleOptionClick("Edit")}
                    disabled={isEmpty}
                  >
                    Edit
                  </button>
                  <button
                    className="nominee-add-option-add-nominee"
                    onClick={() => handleOptionClick("Delete")}
                    disabled={isEmpty}
                  >
                    Delete
                  </button>
                  <button
                    className="nominee-add-option-add-nominee"
                    onClick={() => handleOptionClick("View Assets")}
                    disabled={isEmpty}
                  >
                    View Assets
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="nominee-add-contact-info-add-nominee">
        <div className="nominee-add-contact-row">
          <p className="nominee-add-info-add-nominee">
            <span className="nominee-add-info-label-add-nominee">Email</span>
            <br />
            {email || "-"}
          </p>
          <p className="nominee-add-info-add-nominee">
            <span className="nominee-add-info-label-add-nominee">Phone</span>
            <br />
            {phone_number || "-"}
          </p>
        </div>
      </div>

      {isPopupOpen && (
        <div className="nominee-add-popup-overlay nominee-add">
          <div className="nominee-add-popup-content nominee-add">
            <div className="nominee-add-popup-header">
              <h2 className="nominee-add-asset-title">Assets for {fullName}</h2>
              <span className="nominee-add-asset-count">0 Assets</span>
            </div>
            <p className="nominee-add-no-assets">Nothing allocated</p>
            <button
              className="nominee-add-button-add-nominee nominee-add-button-close-popup"
              onClick={closePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AddNomineeForm = ({
  onNomineeAdded,
  onEditNominee,
  editNominee,
  nominees,
  onCancel,
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    contact: null,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone_number: "",
    phone_number1: "",
    phone_number2: "",
    category: "",
    relation: "",
    profileImage: null,
  });
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [showRelationInput, setShowRelationInput] = useState(false);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelation, setCustomRelation] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [allContacts, setAllContacts] = useState([]);
  const navigate = useNavigate();

  const relationOptions = [
    "Wife",
    "Husband",
    "Mother",
    "Father",
    "Sister",
    "Brother",
    "Daughter",
    "Son",
    "Custom",
  ];

  useEffect(() => {
    if (editNominee) {
      const contactLabel = [editNominee.firstName, editNominee.middleName, editNominee.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const imageUrl = editNominee.profileImage
        ? `${import.meta.env.VITE_API_URL}${editNominee.profileImage}`
        : null;

      // Find matching contact in allContacts
      const matchingContact = allContacts.find(
        (contact) =>
          contact.phone_number === editNominee.phone_number ||
          contact.email === editNominee.email
      );

      console.log("Edit Nominee:", editNominee);
      console.log("Matching Contact:", matchingContact);
      console.log("Image URL:", imageUrl);

      setFormData({
        contact: matchingContact
          ? {
              value: matchingContact.phone_number,
              label: [matchingContact.first_name, matchingContact.middle_name, matchingContact.last_name]
                .filter(Boolean)
                .join(" ")
                .trim(),
              fName: matchingContact.first_name || "",
              mName: matchingContact.middle_name || "",
              lName: matchingContact.last_name || "",
              email: matchingContact.email || "",
              phone: matchingContact.phone_number || "",
              category: matchingContact.category || "",
              relation: matchingContact.relation || "",
            }
          : {
              value: editNominee.phone_number,
              label: contactLabel || editNominee.phone_number,
              fName: editNominee.firstName || "",
              mName: editNominee.middleName || "",
              lName: editNominee.lastName || "",
              email: editNominee.email || "",
              phone: editNominee.phone_number || "",
              category: editNominee.category || "",
              relation: editNominee.relation || "",
            },
        firstName: editNominee.firstName || "",
        middleName: editNominee.middleName || "",
        lastName: editNominee.lastName || "",
        email: editNominee.email || "",
        phone_number: editNominee.phone_number || "",
        phone_number1: editNominee.phone_number1 || "",
        phone_number2: editNominee.phone_number2 || "",
        category: editNominee.category || "",
        relation: editNominee.relation || "",
        profileImage: null,
      });
      setShowPhone1(!!editNominee.phone_number1);
      setShowPhone2(!!editNominee.phone_number2);
      setShowRelationInput(editNominee.category === "Family");
      setIsCustomRelation(editNominee.relation && !relationOptions.includes(editNominee.relation));
      setCustomRelation(editNominee.relation || "");
      setImagePreview(imageUrl);
    } else {
      setFormData({
        contact: null,
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone_number: "",
        phone_number1: "",
        phone_number2: "",
        category: "",
        relation: "",
        profileImage: null,
      });
      setShowPhone1(false);
      setShowPhone2(false);
      setShowRelationInput(false);
      setIsCustomRelation(false);
      setCustomRelation("");
      setImagePreview(null);
    }
  }, [editNominee, allContacts]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category"
        ? {
            relation: value === "Family" ? prev.relation : "",
            category: value,
          }
        : {}),
    }));
    if (name === "category") {
      setShowRelationInput(value === "Family");
      if (value !== "Family") {
        setCustomRelation("");
        setIsCustomRelation(false);
      }
    }
  };

  const handleAddPhoneNumber = () => {
    if (!showPhone1) {
      setShowPhone1(true);
    } else if (!showPhone2) {
      setShowPhone2(true);
    }
  };

  const handleRelationSelect = (value) => {
    if (value === "Custom") {
      setIsCustomRelation(true);
      setFormData((prev) => ({ ...prev, relation: "" }));
    } else {
      setIsCustomRelation(false);
      setFormData((prev) => ({ ...prev, relation: value }));
      setCustomRelation(value);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (formData.category === "Family" && !formData.relation) {
      toast.error("Please select or enter a relationship for Family category.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!formData.firstName) {
      toast.error("Please enter a first name.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    if (!formData.phone_number) {
      toast.error("Please enter a primary phone number.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("firstName", formData.firstName);
    submitData.append("middleName", formData.middleName);
    submitData.append("lastName", formData.lastName);
    submitData.append("email", formData.email);
    submitData.append("phone_number", formData.phone_number);
    submitData.append("phone_number1", formData.phone_number1);
    submitData.append("phone_number2", formData.phone_number2);
    submitData.append("category", formData.category);
    submitData.append("relation", formData.category === "Family" ? formData.relation : "");
    if (formData.profileImage) {
      submitData.append("profileImage", formData.profileImage);
    }

    try {
      const url = editNominee
        ? `${import.meta.env.VITE_API_URL}/api/nominees/${editNominee.id}`
        : `${import.meta.env.VITE_API_URL}/api/nominees`;
      const method = editNominee ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        credentials: "include",
        body: submitData,
      });

      const data = await response.json();
      if (data.success) {
        const nomineeData = {
          id: editNominee ? editNominee.id : data.nominee.id,
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          email: formData.email,
          phone_number: formData.phone_number,
          phone_number1: formData.phone_number1,
          phone_number2: formData.phone_number2,
          category: formData.category,
          relation: formData.relation,
          nominee_type: editNominee ? editNominee.type : data.nominee.nominee_type,
          profile_image: data.nominee.profile_image || editNominee?.profileImage,
          created_at: editNominee ? editNominee.created_at : data.nominee.created_at,
        };

        if (editNominee) {
          onEditNominee(nomineeData);
          toast.success("Nominee updated successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          onNomineeAdded(nomineeData);
          toast.success("Nominee added successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        }

        setFormData({
          contact: null,
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          phone_number: "",
          phone_number1: "",
          phone_number2: "",
          category: "",
          relation: "",
          profileImage: null,
        });
        setShowPhone1(false);
        setShowPhone2(false);
        setShowRelationInput(false);
        setCustomRelation("");
        setImagePreview(null);
        onClose();
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to save nominee.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error saving nominee:", err);
      toast.error("Error saving nominee. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        setAllContacts(data.contacts || []);
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to fetch contacts.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Error fetching contacts. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchAllContacts();
  }, []);

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#fff",
      fontSize: "1rem",
      marginTop: "8px",
      borderColor: "#e9e6ff",
      boxShadow: state.isFocused ? "#000" : "none",
      "&:hover": {
        borderColor: "#e9e6ff",
      },
      minHeight: "30px",
      borderRadius: "5px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#2684FF" : state.isFocused ? "#f0f8ff" : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      padding: 10,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333",
    }),
  };

  const contacts = allContacts?.map((item) => ({
    value: item.phone_number,
    label: [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" "),
    fName: item.first_name,
    mName: item.middle_name || "",
    lName: item.last_name || "",
    email: item.email || "",
    phone: item.phone_number,
    category: item.category || "",
    relation: item.relation || "",
  }));

  if (!isOpen) return null;

  return (
    <div className="nominee-add-popup-overlay nominee-add">
      <div className="nominee-add-popup-content nominee-add-form">
        <h2 className="nominee-add-form-title-add-nominee">
          {editNominee ? "Edit Nominee" : "Add New Nominee"}
        </h2>
        <div className="nominee-add-form-line-add-nominee"></div>
        <div className="nominee-add-form-layout">
          <div className="nominee-add-form-fields-add-nominee">
            <div className="nominee-add-field-group full-width">
              <label className="nominee-add-form-label-add-nominee">Search Contact</label>
              <Select
                options={contacts}
                value={formData.contact}
                name="contact"
                styles={customStyles}
                placeholder="Search Contact..."
                onChange={(selectedOption) => {
                  setFormData((prev) => ({
                    ...prev,
                    contact: selectedOption,
                    firstName: selectedOption?.fName || "",
                    middleName: selectedOption?.mName || "",
                    lastName: selectedOption?.lName || "",
                    email: selectedOption?.email || "",
                    phone_number: selectedOption?.phone || "",
                    category: selectedOption?.category || "",
                    relation: selectedOption?.relation || "",
                  }));
                }}
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">First Name</label>
              <input
                type="text"
                name="firstName"
                className="nominee-add-input-field-add-nominee"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">Middle Name</label>
              <input
                type="text"
                name="middleName"
                className="nominee-add-input-field-add-nominee"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="nominee-add-input-field-add-nominee"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">Email Address</label>
              <input
                type="email"
                name="email"
                className="nominee-add-input-field-add-nominee"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">Phone Number</label>
              <PhoneInput
                country="in"
                value={formData.phone_number}
                onChange={(phone) => handleInputChange("phone_number", phone)}
                inputClass="nominee-add-input-field-add-nominee"
                containerClass="nominee-add-phone-input-container"
                required
                enableSearch
                disableDropdown={false}
              />
            </div>
            <div className="nominee-add-field-group">
              <label className="nominee-add-form-label-add-nominee">Category</label>
              <select
                name="category"
                className="nominee-add-input-field-add-nominee"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="Family">Family</option>
                <option value="Friends">Friends</option>
                <option value="Work">Work</option>
              </select>
            </div>
            {showPhone1 && (
              <div className="nominee-add-field-group">
                <label className="nominee-add-form-label-add-nominee">Phone Number 1</label>
                <PhoneInput
                  country="in"
                  value={formData.phone_number1}
                  onChange={(phone) => handleInputChange("phone_number1", phone)}
                  inputClass="nominee-add-input-field-add-nominee"
                  containerClass="nominee-add-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {showPhone2 && (
              <div className="nominee-add-field-group">
                <label className="nominee-add-form-label-add-nominee">Phone Number 2</label>
                <PhoneInput
                  country="in"
                  value={formData.phone_number2}
                  onChange={(phone) => handleInputChange("phone_number2", phone)}
                  inputClass="nominee-add-input-field-add-nominee"
                  containerClass="nominee-add-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {(!showPhone1 || !showPhone2) && (
              <div className="nominee-add-field-group full-width">
                <button
                  type="button"
                  className="nominee-add-button-add-nominee nominee-add-button-add-number-add-nominee"
                  onClick={handleAddPhoneNumber}
                >
                  + Add Another Number
                </button>
              </div>
            )}
            {showRelationInput && (
              <div className="nominee-add-field-group">
                <label className="nominee-add-form-label-add-nominee">Relationship</label>
                {!isCustomRelation ? (
                  <select
                    name="relation"
                    className="nominee-add-input-field-add-nominee"
                    value={formData.relation}
                    onChange={(e) => handleRelationSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Relationship</option>
                    {relationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="nominee-add-input-field-add-nominee"
                    placeholder="Enter custom relationship"
                    value={customRelation}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomRelation(value);
                      setFormData((prev) => ({ ...prev, relation: value }));
                    }}
                    required
                  />
                )}
              </div>
            )}
          </div>
          <div className="nominee-add-profile-section">
            <div className="nominee-add-avatar-wrapper-add-nominee">
              <div
                className="nominee-add-avatar-add-nominee"
                style={
                  imagePreview
                    ? {
                        backgroundImage: `url(${imagePreview})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : { backgroundColor: "#DAE8E8" }
                }
              >
                <label htmlFor="avatar-upload-form" className="nominee-add-avatar-upload">
                  <FaCamera className="nominee-add-camera-icon" />
                  <input
                    type="file"
                    id="avatar-upload-form"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
            <span className="nominee-add-profile-label">Add Photo</span>
          </div>
        </div>
        <div className="nominee-add-form-actions-add-nominee">
          <button
            type="submit"
            className="nominee-add-button-add-nominee nominee-add-button-submit-add-nominee"
            onClick={handleSubmit}
          >
            {editNominee ? "Update Nominee" : "Add New Nominee"}
          </button>
          <button
            type="button"
            className="nominee-add-button-add-nominee nominee-add-button-cancel-add-nominee"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Nominee = () => {
  const [nominees, setNominees] = useState([]);
  const [editNominee, setEditNominee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchNominees = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nominees`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        const updatedNominees = data.nominees.map((nominee) => ({
          ...nominee,
          first_name: nominee.first_name || "",
          middle_name: nominee.middle_name || "",
          last_name: nominee.last_name || "",
          profile_image: nominee.profile_image || "",
          nominee_type: nominee.nominee_type || "",
        }));
        setNominees(updatedNominees || []);
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to fetch nominees.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching nominees:", err);
      toast.error("Error fetching nominees. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [navigate]);

  useEffect(() => {
    fetchNominees();
  }, [fetchNominees]);

  const handleNomineeAdded = async (nominee) => {
    await fetchNominees();
    setShowForm(false);
  };

  const handleEditNominee = (nominee) => {
    setEditNominee({
      id: nominee.id,
      type: nominee.nominee_type,
      firstName: nominee.first_name,
      middleName: nominee.middle_name,
      lastName: nominee.last_name,
      email: nominee.email,
      phone_number: nominee.phone_number,
      phone_number1: nominee.phone_number1,
      phone_number2: nominee.phone_number2,
      category: nominee.category,
      relation: nominee.relation,
      profileImage: nominee.profile_image,
    });
    setShowForm(true);
  };

  const handleUpdateNominee = async (nominee) => {
    await fetchNominees();
    setEditNominee(null);
    setShowForm(false);
  };

  const handleRemoveNominee = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nominees/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        await fetchNominees();
        toast.success("Nominee removed successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to remove nominee.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error removing nominee:", err);
      toast.error("Error removing nominee. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleImageUpload = (data) => {
    const { id, imagePath } = data;
    setNominees((prev) =>
      prev.map((nominee) =>
        nominee.id === id ? { ...nominee, profile_image: imagePath } : nominee
      )
    );
  };

  const handleCancel = () => {
    setEditNominee(null);
    setShowForm(false);
  };

  const handleAddNomineeClick = () => {
    if (nominees.length >= 5) {
      toast.warn("Maximum of five nominees already added!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    setEditNominee(null);
    setShowForm(true);
  };

  const nomineeSlots = Array(5).fill({});
  let availableNominees = [...nominees];

  const typeOrder = ["Primary", "Secondary", "Tertiary", "Quaternary", "Quinary"];
  typeOrder.forEach((type, index) => {
    const nomineeIndex = availableNominees.findIndex((n) => n.nominee_type === type);
    if (nomineeIndex !== -1) {
      nomineeSlots[index] = availableNominees.splice(nomineeIndex, 1)[0];
    }
  });

  for (let i = 0; i < nomineeSlots.length; i++) {
    if (!nomineeSlots[i].id && availableNominees.length > 0) {
      nomineeSlots[i] = availableNominees.shift();
    }
  }

  return (
    <div className="nominee-add-contact-container-add-nominee">
      <ToastContainer />
      <div className="nominee-add-header-section-add-nominee">
        <h1 className="nominee-add-page-title-add-nominee">Nominee Management</h1>
        <button
          className="nominee-add-button-add-nominee nominee-add-button-submit-add-nominee"
          onClick={handleAddNomineeClick}
        >
          + Add
        </button>
      </div>
      <p className="nominee-add-page-description-add-nominee">
        Manage your trusted contacts who can access your information in case of an emergency
      </p>
      <div className="nominee-add-layout-add-nominee">
        <div
          className="nominee-add-nominee-list-add-nominee"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 2fr)", gap: "20px" }}
        >
          {nomineeSlots.map((nominee, index) => (
            <NomineeCard
              key={index}
              id={nominee.id}
              type={nominee.nominee_type}
              firstName={nominee.first_name}
              middleName={nominee.middle_name}
              lastName={nominee.last_name}
              email={nominee.email}
              phone_number={nominee.phone_number}
              phone_number1={nominee.phone_number1}
              phone_number2={nominee.phone_number2}
              category={nominee.category}
              relation={nominee.relation}
              profileImage={nominee.profile_image}
              onEdit={handleEditNominee}
              onRemove={handleRemoveNominee}
              onImageUpload={handleImageUpload}
              isEmpty={!nominee.id}
            />
          ))}
        </div>
      </div>
      {showForm && (
        <AddNomineeForm
          onNomineeAdded={handleNomineeAdded}
          onEditNominee={handleUpdateNominee}
          editNominee={editNominee}
          nominees={nominees}
          onCancel={handleCancel}
          isOpen={showForm}
          onClose={handleCancel}
        />
      )}
    </div>
  );
};

export default Nominee;
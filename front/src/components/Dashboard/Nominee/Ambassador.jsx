import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./Ambassador.css";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

const AmbassadorCard = ({
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
  isEmpty,
}) => {
  const [isInviting, setIsInviting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Not Assigned";

  const getInitials = () => {
    if (isEmpty) return "NA";
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return "NA";
  };
  
  const handleInvite = async () => {
    if (isEmpty) return;
    if (!type || type === "") {
      toast.error("No ambassador type chosen. Please choose an ambassador type first.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    setIsInviting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ambassadors/send-invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ambassadorId: id }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Invite sent successfully!", {
          position: "top-right",
          autoClose: 3000,
          onClose: () => setIsInviting(false),
        });
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to send invite.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => setIsInviting(false),
          });
        }
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      toast.error("Error sending invite. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        onClose: () => setIsInviting(false),
      });
    }
  };

  const relationshipDisplay = category
    ? category === "Family" && relation
      ? `${category} (${relation})`
      : category
    : "-";

  const handleOptionClick = (action) => {
    switch (action) {
      case "Invite":
        handleInvite();
        break;
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
      default:
        break;
    }
    setShowOptions(false);
  };

  return (
    <div className="ambassador-add-card-add-ambassador">
      {isInviting && (
        <div className="loader-overlay-add-ambassador">
          <div className="spinner-add-ambassador"></div>
        </div>
      )}
      <div className="ambassador-add-card-content-add-ambassador">
        <div className="ambassador-add-avatar-wrapper-add-ambassador">
          <div
            className="ambassador-add-avatar-add-ambassador"
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
            {!profileImage && <span>{getInitials()}</span>}
          </div>
        </div>
        <div className="ambassador-add-details-add-ambassador">
          <div className="ambassador-add-name-relation-add-ambassador">
            <div>
              <h3 className="ambassador-add-name-add-ambassador">{fullName}</h3>
              <p className="ambassador-add-type-add-ambassador">{type || "No Type Assigned"}</p>
            </div>
            <div
              className="ambassador-add-options-add-ambassador"
              onClick={() => setShowOptions(!showOptions)}
            >
              ...
              {showOptions && (
                <div className="ambassador-add-options-menu-add-ambassador">
                  <button
                    className="ambassador-add-option-add-ambassador"
                    onClick={() => handleOptionClick("Invite")}
                    disabled={isInviting || isEmpty}
                  >
                    Send Invite
                  </button>
                  <button
                    className="ambassador-add-option-add-ambassador"
                    onClick={() => handleOptionClick("Edit")}
                    disabled={isEmpty}
                  >
                    Edit
                  </button>
                  <button
                    className="ambassador-add-option-add-ambassador"
                    onClick={() => handleOptionClick("Delete")}
                    disabled={isEmpty}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="ambassador-add-contact-info-add-ambassador">
        <div className="ambassador-add-contact-row">
          <p className="ambassador-add-info-add-ambassador">
            <span className="ambassador-add-info-label-add-ambassador">Phone</span>
            <br />
            {phone_number || "-"}
          </p>
          <p className="ambassador-add-info-add-ambassador">
            <span className="ambassador-add-info-label-add-ambassador">Email</span>
            <br />
            {email || "-"}
          </p>
        </div>
        <div className="ambassador-add-category-row">
          <p className="ambassador-add-info-add-ambassador">
            <span className="ambassador-add-info-label-add-ambassador">Category</span>
            <br />
            {relationshipDisplay}
          </p>
        </div>
      </div>
    </div>
  );
};

const AddAmbassadorForm = ({
  onAmbassadorAdded,
  onEditAmbassador,
  editAmbassador,
  ambassadors,
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
    ambassadorType: ambassadors.length === 0 ? "Primary" : "Secondary",
    profileImage: null,
  });
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [showRelationInput, setShowRelationInput] = useState(false);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelation, setCustomRelation] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
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
    if (editAmbassador) {
      setFormData({
        contact: {
          value: editAmbassador?.phone_number,
          label: [editAmbassador.firstName, editAmbassador.middleName, editAmbassador.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
        },
        firstName: editAmbassador.firstName || "",
        middleName: editAmbassador.middleName || "",
        lastName: editAmbassador.lastName || "",
        email: editAmbassador.email || "",
        phone_number: editAmbassador.phone_number || "",
        phone_number1: editAmbassador.phone_number1 || "",
        phone_number2: editAmbassador.phone_number2 || "",
        category: editAmbassador.category || "",
        relation: editAmbassador.relation || "",
        ambassadorType: editAmbassador.type || "",
        profileImage: null,
      });
      setShowPhone1(!!editAmbassador.phone_number1);
      setShowPhone2(!!editAmbassador.phone_number2);
      setShowRelationInput(editAmbassador.category === "Family");
      setCustomRelation(editAmbassador.relation || "");
      setImagePreview(
        editAmbassador.profileImage
          ? `${import.meta.env.VITE_API_URL}${editAmbassador.profileImage.startsWith("/") ? "" : "/"}${editAmbassador.profileImage}`
          : null
      );
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
        ambassadorType: ambassadors.length === 0 ? "Primary" : "Secondary",
        profileImage: null,
      });
      setShowPhone1(false);
      setShowPhone2(false);
      setShowRelationInput(false);
      setCustomRelation("");
      setImagePreview(null);
    }
  }, [editAmbassador, ambassadors]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      setCustomRelation("");
    }
  };

  useEffect(() => {
    if (formData.relation) {
      if (relationOptions.includes(formData.relation)) {
        setIsCustomRelation(false);
        setCustomRelation("");
      } else {
        setIsCustomRelation(true);
        setCustomRelation(formData.relation);
      }
    }
  }, [formData.relation]);

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
    if (!formData.ambassadorType) {
      toast.error("Please select an ambassador type.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
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

    const formDataToSend = new FormData();
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("middleName", formData.middleName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone_number", formData.phone_number);
    formDataToSend.append("phone_number1", formData.phone_number1);
    formDataToSend.append("phone_number2", formData.phone_number2);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("relation", formData.category === "Family" ? formData.relation : "");
    formDataToSend.append("ambassadorType", formData.ambassadorType);
    if (formData.profileImage instanceof File) {
      formDataToSend.append("profileImage", formData.profileImage);
    }

    try {
      const url = editAmbassador
        ? `${import.meta.env.VITE_API_URL}/api/ambassadors/${editAmbassador.id}`
        : `${import.meta.env.VITE_API_URL}/api/ambassadors`;
      const method = editAmbassador ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        credentials: "include",
        body: formDataToSend,
      });
      const data = await response.json();
      if (data.success) {
        if (editAmbassador) {
          onEditAmbassador({
            ...data.ambassador,
            profileImage: data.ambassador.profile_image,
          });
          toast.success("Ambassador updated successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          onAmbassadorAdded({
            ...data.ambassador,
            profileImage: data.ambassador.profile_image,
          });
          toast.success("Ambassador added successfully!", {
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
          ambassadorType: ambassadors.length === 0 ? "Primary" : "Secondary",
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
          toast.error(data.message || "Failed to save ambassador", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error saving ambassador:", err);
      toast.error("Error saving ambassador. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setAllContacts(data.contacts);
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to fetch contacts", {
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
      backgroundColor: state.isSelected
        ? "#2684FF"
        : state.isFocused
        ? "#f0f8ff"
        : "#fff",
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
    <div className="ambassador-add-popup-overlay ambassador-add">
      <div className="ambassador-add-popup-content ambassador-add-form">
        <h2 className="ambassador-add-form-title-add-ambassador">
          {editAmbassador ? "Edit Ambassador" : "Add New Ambassador"}
        </h2>
        <div className="ambassador-add-form-line-add-ambassador"></div>
        <div className="ambassador-add-form-layout">
          <div className="ambassador-add-form-fields-add-ambassador">
            <div className="ambassador-add-field-group full-width">
              <label className="ambassador-add-form-label-add-ambassador">Search Contact</label>
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
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">First Name</label>
              <input
                type="text"
                name="firstName"
                className="ambassador-add-input-field-add-ambassador"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">Middle Name</label>
              <input
                type="text"
                name="middleName"
                className="ambassador-add-input-field-add-ambassador"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
              />
            </div>
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="ambassador-add-input-field-add-ambassador"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">Email Address</label>
              <input
                type="email"
                name="email"
                className="ambassador-add-input-field-add-ambassador"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">Phone Number</label>
              <PhoneInput
                country="in"
                value={formData.phone_number}
                onChange={(phone) => handleInputChange("phone_number", phone)}
                inputClass="ambassador-add-input-field-add-ambassador"
                containerClass="ambassador-add-phone-input-container"
                required
                enableSearch
                disableDropdown={false}
              />
            </div>
            <div className="ambassador-add-field-group">
              <label className="ambassador-add-form-label-add-ambassador">Category</label>
              <select
                name="category"
                className="ambassador-add-input-field-add-ambassador"
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
              <div className="ambassador-add-field-group">
                <label className="ambassador-add-form-label-add-ambassador">Phone Number 1</label>
                <PhoneInput
                  country="in"
                  value={formData.phone_number1}
                  onChange={(phone) => handleInputChange("phone_number1", phone)}
                  inputClass="ambassador-add-input-field-add-ambassador"
                  containerClass="ambassador-add-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {showPhone2 && (
              <div className="ambassador-add-field-group">
                <label className="ambassador-add-form-label-add-ambassador">Phone Number 2</label>
                <PhoneInput
                  country="in"
                  value={formData.phone_number2}
                  onChange={(phone) => handleInputChange("phone_number2", phone)}
                  inputClass="ambassador-add-input-field-add-ambassador"
                  containerClass="ambassador-add-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {(!showPhone1 || !showPhone2) && (
              <div className="ambassador-add-field-group full-width">
                <button
                  type="button"
                  className="ambassador-add-button-add-ambassador ambassador-add-button-add-number-add-ambassador"
                  onClick={handleAddPhoneNumber}
                >
                  + Add Another Number
                </button>
              </div>
            )}
            {showRelationInput && (
              <div className="ambassador-add-field-group">
                <label className="ambassador-add-form-label-add-ambassador">Relationship</label>
                {!isCustomRelation ? (
                  <select
                    name="relation"
                    className="ambassador-add-input-field-add-ambassador"
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
                    className="ambassador-add-input-field-add-ambassador"
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
            <div className="ambassador-add-field-group full-width">
              <label className="ambassador-add-form-label-add-ambassador">Ambassador Type</label>
              <div className="ambassador-add-type-radio-add-ambassador">
                <label>
                  <input
                    type="radio"
                    name="ambassadorType"
                    value="Primary"
                    checked={formData.ambassadorType === "Primary"}
                    onChange={(e) => handleInputChange("ambassadorType", e.target.value)}
                    disabled={
                      ambassadors.some((a) => a.ambassador_type === "Primary") &&
                      (!editAmbassador || editAmbassador.type !== "Primary")
                    }
                  />
                  Initiator
                </label>
                <label>
                  <input
                    type="radio"
                    name="ambassadorType"
                    value="Secondary"
                    checked={formData.ambassadorType === "Secondary"}
                    onChange={(e) => handleInputChange("ambassadorType", e.target.value)}
                    disabled={
                      ambassadors.some((a) => a.ambassador_type === "Secondary") &&
                      (!editAmbassador || editAmbassador.type !== "Secondary")
                    }
                  />
                  Approver
                </label>
              </div>
            </div>
          </div>
          <div className="ambassador-add-profile-section">
            <div className="ambassador-add-avatar-wrapper-add-ambassador">
              <div
                className="ambassador-add-avatar-add-ambassador"
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
                <label
                  htmlFor="avatar-upload-form"
                  className="ambassador-add-avatar-upload"
                >
                  <svg className="ambassador-add-camera-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9a3 3 0 0 0-3 3v.01a3 3 0 0 0 3 3 3 3 0 0 0 3-3V12a3 3 0 0 0-3-3zm0 4.5a1.5 1.5 0 0 1-1.5-1.5v-.01a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5V12a1.5 1.5 0 0 1-1.5 1.5z"/>
                    <path d="M21 6h-3.56a2.9 2.9 0 0 0-.67-1.29l-.88-.88A3 3 0 0 0 13.95 3H10.1a3 3 0 0 0-2.12.88l-.87.88A2.9 2.9 0 0 0 6.44 6H3a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3zm1.5 12a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 18V9A1.5 1.5 0 0 1 3 7.5h3.44c.3 0 .58-.1.82-.3l.87-.88a1.5 1.5 0 0 1 1.06-.44h3.84a1.5 1.5 0 0 1 1.06.44l.88.88c.24.2.52.3.82.3H21a1.5 1.5 0 0 1 1.5 1.5v9z"/>
                  </svg>
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
            <span className="ambassador-add-profile-label">Add Photo</span>
          </div>
        </div>
        <div className="ambassador-add-form-actions-add-ambassador">
          <button
            type="submit"
            className="ambassador-add-button-add-ambassador ambassador-add-button-submit-add-ambassador"
            onClick={handleSubmit}
          >
            {editAmbassador ? "Update Ambassador" : "Add New Ambassador"}
          </button>
          <button
            type="button"
            className="ambassador-add-button-add-ambassador ambassador-add-button-cancel-add-ambassador"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Ambassador = () => {
  const [ambassadors, setAmbassadors] = useState([]);
  const [editAmbassador, setEditAmbassador] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const ensureAmbassadorTypes = (ambassadorsList) => {
    return ambassadorsList.map((ambassador) => ({
      ...ambassador,
      ambassador_type: ambassador.ambassador_type || "",
      firstName: ambassador.first_name || "",
      middleName: ambassador.middle_name || "",
      lastName: ambassador.last_name || "",
      profileImage: ambassador.profile_image || "",
    }));
  };

  const fetchAmbassadors = useCallback(async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/ambassadors`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        const updatedAmbassadors = ensureAmbassadorTypes(data.ambassadors || []);
        setAmbassadors(updatedAmbassadors);
      } else {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            onClose: () => navigate("/login"),
          });
        } else {
          toast.error(data.message || "Failed to fetch ambassadors", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching ambassadors:", err.message);
      toast.error(`Error fetching ambassadors: ${err.message}. Please try again.`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, [navigate]);

  useEffect(() => {
    fetchAmbassadors();
  }, [fetchAmbassadors]);

  const handleAmbassadorAdded = async () => {
    await fetchAmbassadors();
    setShowForm(false);
  };

  const handleEditAmbassador = (ambassador) => {
    setEditAmbassador(ambassador);
    setShowForm(true);
  };

  const handleUpdateAmbassador = async () => {
    await fetchAmbassadors();
    setEditAmbassador(null);
    setShowForm(false);
  };

  const handleRemoveAmbassador = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ambassadors/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchAmbassadors();
        toast.success("Ambassador removed successfully!", {
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
          toast.error(data.message || "Failed to remove ambassador", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error("Error removing ambassador:", err);
      toast.error("Error removing ambassador. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleCancel = () => {
    setEditAmbassador(null);
    setShowForm(false);
  };

  const handleAddAmbassadorClick = () => {
    if (ambassadors.length >= 2) {
      toast.warn("Maximum of two ambassadors already added!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    setShowForm(true);
  };

  const ambassadorSlots = Array(2).fill({});
  let availableAmbassadors = [...ambassadors];

  const primaryIndex = availableAmbassadors.findIndex((a) => a.ambassador_type === "Primary");
  if (primaryIndex !== -1) {
    ambassadorSlots[0] = availableAmbassadors.splice(primaryIndex, 1)[0];
  }

  const secondaryIndex = availableAmbassadors.findIndex((a) => a.ambassador_type === "Secondary");
  if (secondaryIndex !== -1) {
    ambassadorSlots[1] = availableAmbassadors.splice(secondaryIndex, 1)[0];
  }

  for (let i = 0; i < ambassadorSlots.length; i++) {
    if (!ambassadorSlots[i].id && availableAmbassadors.length > 0) {
      ambassadorSlots[i] = availableAmbassadors.shift();
    }
  }

  return (
    <div className="ambassador-add-contact-container-add-ambassador">
      <ToastContainer />
      <div className="ambassador-add-header-section-add-ambassador">
        <h1 className="ambassador-add-page-title-add-ambassador">Ambassador Management</h1>
        <button
          className="ambassador-add-button-add-ambassador ambassador-add-button-submit-add-ambassador"
          onClick={handleAddAmbassadorClick}
        >
          + Add
        </button>
      </div>
      <p className="ambassador-add-page-description-add-ambassador">
        Manage your trusted ambassadors who can access your information in case of an emergency
      </p>
      <div className="ambassador-add-layout-add-ambassador">
        <div
          className="ambassador-add-ambassador-list-add-ambassador"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 2fr)", gap: "20px" }}
        >
          {ambassadorSlots.map((ambassador, index) => (
            <AmbassadorCard
              key={index}
              id={ambassador.id}
              type={ambassador.ambassador_type}
              firstName={ambassador.firstName}
              middleName={ambassador.middleName}
              lastName={ambassador.lastName}
              email={ambassador.email}
              phone_number={ambassador.phone_number}
              phone_number1={ambassador.phone_number1}
              phone_number2={ambassador.phone_number2}
              category={ambassador.category}
              relation={ambassador.relation}
              profileImage={ambassador.profileImage}
              onEdit={handleEditAmbassador}
              onRemove={handleRemoveAmbassador}
              isEmpty={!ambassador.id}
            />
          ))}
        </div>
      </div>
      {showForm && (
        <AddAmbassadorForm
          onAmbassadorAdded={handleAmbassadorAdded}
          onEditAmbassador={handleUpdateAmbassador}
          editAmbassador={editAmbassador}
          ambassadors={ambassadors}
          onCancel={handleCancel}
          isOpen={showForm}
          onClose={handleCancel}
        />
      )}
    </div>
  );
};

export default Ambassador;
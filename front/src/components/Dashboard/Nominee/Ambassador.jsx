import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./Ambassador.css";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import cameraIcon from "../../../assets/images/dash_icon/camera.svg";

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

  // Map ambassador_type to display labels
  const displayType = type === "Primary" ? "Initiator" : type === "Secondary" ? "Sender" : type || "No Type Assigned";
  
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
              <p className="ambassador-add-type-add-ambassador">{displayType}</p>
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
    profileImage: "",
  });
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [showRelationInput, setShowRelationInput] = useState(false);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelation, setCustomRelation] = useState("");
  const [imagePreview, setImagePreview] = useState("");
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
        profileImage: editAmbassador.profileImage || "",
      });
      setShowPhone1(!!editAmbassador.phone_number1);
      setShowPhone2(!!editAmbassador.phone_number2);
      setShowRelationInput(editAmbassador.category === "Family");
      setCustomRelation(editAmbassador.relation || "");
      setImagePreview(
        editAmbassador.profileImage
          ? `${import.meta.env.VITE_API_URL}${editAmbassador.profileImage.startsWith("/") ? "" : "/"}${editAmbassador.profileImage}`
          : ""
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
        profileImage: "",
      });
      setShowPhone1(false);
      setShowPhone2(false);
      setShowRelationInput(false);
      setCustomRelation("");
      setImagePreview("");
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
    } else if (formData.profileImage) {
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
          profileImage: "",
        });
        setShowPhone1(false);
        setShowPhone2(false);
        setShowRelationInput(false);
        setCustomRelation("");
        setImagePreview("");
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts?all=true`, {
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
    phone_number1: item.phone_number1 || "",
    phone_number2: item.phone_number2 || "",
    category: item.category || "",
    relation: item.relation || "",
    contact_image: item.contact_image || "",
  }));

  return (
    <div>
      <div
        className="ambassador-add-popup-overlay ambassador-add"
        style={{ display: isOpen ? "block" : "none" }}
        onClick={onClose}
      ></div>
      <div className={`ambassador-add-drawer ${isOpen ? "open" : ""}`}>
        <div className="ambassador-add-drawer-top">
          <button className="ambassador-add-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="ambassador-add-drawer-divider"></div>
        <h2 className="ambassador-add-form-title-add-ambassador">
          {editAmbassador ? "Edit Ambassador" : "Add New Ambassador"}
        </h2>
        <div className="ambassador-add-form-content">
          <div className="ambassador-add-form-row">
            <div className="ambassador-add-field-group full-width">
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
                      <img src={cameraIcon} alt="Camera" className="ambassador-add-camera-icon" />
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
                <label
                  htmlFor="avatar-upload-form"
                  className="ambassador-add-profile-label"
                  style={{ cursor: "pointer" }}
                >
                  Add Photo
                </label>
              </div>
            </div>
          </div>
          <div className="ambassador-add-form-row">
            <div className="ambassador-add-field-group full-width">
              <label className="ambassador-add-form-label-add-ambassador">Search Contact</label>
              <Select
                options={contacts}
                value={formData.contact}
                name="contact"
                styles={customStyles}
                placeholder="Search Contact..."
                onChange={(selectedOption) => {
                  const newCategory = selectedOption?.category || "";
                  const contactImage = selectedOption?.contact_image || "";
                  const imageUrl = contactImage
                    ? `${import.meta.env.VITE_API_URL}${contactImage.startsWith("/") ? "" : "/"}${contactImage}`
                    : "";
                  console.log("Selected contact image:", contactImage, "Image URL:", imageUrl); // Debugging
                  setFormData((prev) => ({
                    ...prev,
                    contact: selectedOption,
                    firstName: selectedOption?.fName || "",
                    middleName: selectedOption?.mName || "",
                    lastName: selectedOption?.lName || "",
                    email: selectedOption?.email || "",
                    phone_number: selectedOption?.phone || "",
                    phone_number1: selectedOption?.phone_number1 || "",
                    phone_number2: selectedOption?.phone_number2 || "",
                    category: newCategory,
                    relation: newCategory === "Family" ? selectedOption?.relation || "" : "",
                    profileImage: contactImage,
                  }));
                  setShowPhone1(!!selectedOption?.phone_number1);
                  setShowPhone2(!!selectedOption?.phone_number2);
                  setShowRelationInput(newCategory === "Family");
                  setIsCustomRelation(
                    selectedOption?.relation && !relationOptions.includes(selectedOption?.relation)
                  );
                  setCustomRelation(newCategory === "Family" ? selectedOption?.relation || "" : "");
                  setImagePreview(imageUrl);
                }}
              />
            </div>
          </div>
          <div className="ambassador-add-form-row">
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
          </div>
          <div className="ambassador-add-form-row">
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
            {(!showPhone1 || !showPhone2) && (
              <div className="ambassador-add-field-group">
                <button
                  type="button"
                  className="ambassador-add-button-add-ambassador ambassador-add-button-add-number-add-ambassador"
                  onClick={handleAddPhoneNumber}
                >
                  + Add Another Number
                </button>
              </div>
            )}
          </div>
          <div className="ambassador-add-form-row">
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
          </div>
          {showRelationInput && (
            <div className="ambassador-add-form-row">
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
            </div>
          )}
          <div className="ambassador-add-form-row">
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
                      ambassadors.filter((a) => a.ambassador_type === "Primary").length >= 4 &&
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
                      ambassadors.filter((a) => a.ambassador_type === "Secondary").length >= 4 &&
                      (!editAmbassador || editAmbassador.type !== "Secondary")
                    }
                  />
                  Sender
                </label>
              </div>
            </div>
          </div>
          <div className="ambassador-add-form-actions-add-ambassador">
            <button
              type="button"
              className="ambassador-add-button-add-ambassador ambassador-add-button-cancel-add-ambassador"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ambassador-add-button-add-ambassador ambassador-add-button-submit-add-ambassador"
              onClick={handleSubmit}
            >
              {editAmbassador ? "Update Ambassador" : "Add New Ambassador"}
            </button>
          </div>
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
        // Sort ambassadors by created_at in ascending order
        updatedAmbassadors.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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
    if (ambassadors.length >= 8) {
      toast.warn("Maximum of eight ambassadors already added!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    setShowForm(true);
  };

  const ambassadorSlots = Array(8).fill({});
  let availableAmbassadors = [...ambassadors];

  // Fill slots with ambassadors in the order they were added
  for (let i = 0; i < ambassadorSlots.length && availableAmbassadors.length > 0; i++) {
    ambassadorSlots[i] = availableAmbassadors.shift();
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
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 2fr)", 
            gap: "20px" 
          }}
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
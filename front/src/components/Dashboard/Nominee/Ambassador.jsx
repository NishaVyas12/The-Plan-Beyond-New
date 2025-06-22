
import React, { useState, useEffect, useCallback } from "react";
import { FaCamera } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./Ambassador.css";
import editIcon from "../../../assets/images/dash_icon/pen.svg";
import mailIcon from "../../../assets/images/dash_icon/mail.svg";
import deleteIcon from "../../../assets/images/dash_icon/trash.svg";
import Select from "react-select";

const AmbassadorCard = ({
  id,
  type,
  name = "",
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
  const [isInviting, setIsInviting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

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
        `${import.meta.env.VITE_API_URL}/api/send-ambassador-invite`,
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
        toast.error(data.message || "Failed to send invite.", {
          position: "top-right",
          autoClose: 3000,
          onClose: () => setIsInviting(false),
        });
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

  const handleImageUpload = async (event) => {
    if (isEmpty) return;
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("ambassadorId", id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload-ambassador-image`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        onImageUpload({ id, imagePath: data.imagePath });
        toast.success("Profile image uploaded successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(data.message || "Failed to upload image.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Error uploading image. Please try again.", {
        position: "top-right",
        autoClose: 3000,
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
          name,
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
            <label
              htmlFor={`avatar-upload-${id}`}
              className="ambassador-add-avatar-upload"
            >
              <FaCamera className="ambassador-add-camera-icon" />
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
        <div className="ambassador-add-details-add-ambassador">
          <div className="ambassador-add-name-relation-add-ambassador">
            <h3 className="ambassador-add-name-add-ambassador">{name || "Not Assigned"}</h3>
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
                    disabled={isInviting}
                  >
                    Send Invite
                  </button>
                  <button
                    className="ambassador-add-option-add-ambassador"
                    onClick={() => handleOptionClick("Edit")}
                  >
                    Edit
                  </button>
                  <button
                    className="ambassador-add-option-add-ambassador"
                    onClick={() => handleOptionClick("Delete")}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="ambassador-add-relation-add-ambassador">{relationshipDisplay}</p>
        </div>
      </div>
      <div className="ambassador-add-contact-info-add-ambassador">
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
  const [imagePreview, setImagePreview] = useState(null);

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
      const nameParts = editAmbassador.name ? editAmbassador.name.split(" ") : ["", "", ""];
      setFormData({
        contact: {
          value: editAmbassador?.phone_number,
          label: editAmbassador?.name,
        },
        firstName: nameParts[0] || "",
        middleName: nameParts.length > 2 ? nameParts[1] : "",
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
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
        profileImage: "",
      });
      setShowPhone1(false);
      setShowPhone2(false);
      setShowRelationInput(false);
      setCustomRelation("");
      setImagePreview(null);
    }
  }, [editAmbassador, ambassadors]);

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
    const fullName = [formData.firstName, formData.middleName, formData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!fullName) {
      toast.error("Please enter at least a first name.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    const submitData = {
      ...formData,
      firstName: fullName,
      relation: formData.category === "Family" ? formData.relation : "",
    };
    try {
      const url = editAmbassador
        ? `${import.meta.env.VITE_API_URL}/api/update-ambassador/${editAmbassador.id}`
        : `${import.meta.env.VITE_API_URL}/api/add-ambassador`;
      const method = editAmbassador ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (data.success) {
        if (editAmbassador) {
          onEditAmbassador({ ...submitData, id: editAmbassador.id });
          toast.success("Ambassador updated successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          onAmbassadorAdded({ ...data.ambassador, name: fullName });
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
        setImagePreview(null);
        onClose();
      } else {
        toast.error(data.message || "Failed to save ambassador", {
          position: "top-right",
          autoClose: 3000,
        });
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/get-contacts`,
        { credentials: "include" }
      );
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse error for contacts:", err);
        toast.error("Invalid server response for contacts");
        return;
      }
      if (data.success) {
        setAllContacts(data.contacts);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Error fetching contacts");
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

  const contacts = allContacts?.map((item) => {
    const nameParts = item.name.trim().split(" ");
    const fName = nameParts[0] || "";
    const mName = nameParts.length === 3 ? nameParts[1] : "";
    const lName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : "";

    return {
      value: item.phone_number,
      label: item.name,
      fName,
      mName,
      lName,
      email: item.email || "",
      phone: item.phone_number,
      category: item.category,
      relation: item.relation,
    };
  });

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
            <div className="ambassador-add-field-group">
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
                    lastName: selectedOption?.lName || "",
                    middleName: selectedOption?.mName || "",
                    email: selectedOption?.email || "",
                    phone_number: selectedOption?.phone || "",
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
                  <FaCamera className="ambassador-add-camera-icon" />
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

  const ensureAmbassadorTypes = (ambassadorsList) => {
    return ambassadorsList.map((ambassador) => ({
      ...ambassador,
      ambassador_type: ambassador.ambassador_type || "",
    }));
  };

  const fetchAmbassadors = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/get-ambassadors`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        const updatedAmbassadors = ensureAmbassadorTypes(data.ambassadors || []);
        setAmbassadors(updatedAmbassadors);
      } else {
        toast.error(data.message || "Failed to fetch ambassadors", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error fetching ambassadors:", err);
      toast.error("Error fetching ambassadors. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, []);

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
        `${import.meta.env.VITE_API_URL}/api/remove-ambassador/${id}`,
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
        toast.error(data.message || "Failed to remove ambassador", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error removing ambassador:", err);
      toast.error("Error removing ambassador. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleImageUpload = (data) => {
    const { id, imagePath } = data;
    setAmbassadors((prev) =>
      prev.map((ambassador) =>
        ambassador.id === id
          ? { ...ambassador, profile_image: imagePath }
          : ambassador
      )
    );
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

  const ambassadorSlots = [
    ambassadors.find((a) => a.ambassador_type === "Primary") || {},
    ambassadors.find((a) => a.ambassador_type === "Secondary") || {},
  ];

  return (
    <div className="ambassador-add-contact-container-add-ambassador">
      <ToastContainer />
      <div className="ambassador-add-header-section-add-ambassador">
        <h1 className="ambassador-add-page-title-add-ambassador">Ambassador Management</h1>
        <button
          className="ambassador-add-button-add-ambassador ambassador-add-button-submit-add-ambassador"
          onClick={handleAddAmbassadorClick}
        >
          Add Ambassador
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
              name={ambassador.first_name}
              email={ambassador.email}
              phone_number={ambassador.phone_number}
              phone_number1={ambassador.phone_number1}
              phone_number2={ambassador.phone_number2}
              category={ambassador.category}
              relation={ambassador.relation}
              profileImage={ambassador.profile_image}
              onEdit={handleEditAmbassador}
              onRemove={handleRemoveAmbassador}
              onImageUpload={handleImageUpload}
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

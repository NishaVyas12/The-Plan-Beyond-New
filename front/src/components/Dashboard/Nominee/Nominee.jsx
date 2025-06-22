import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import editIcon from "../../../assets/images/dash_icon/pen.svg";
import eyeIcon from "../../../assets/images/dash_icon/eye.svg";
import deleteIcon from "../../../assets/images/dash_icon/trash.svg";
import "./Nominee.css";
import Select from "react-select";
import "react-phone-input-2/lib/style.css";
import "react-toastify/dist/ReactToastify.css";

const NomineeCard = ({
  id,
  title,
  name = "",
  email = "",
  phone_number = "",
  phone_number1 = "",
  phone_number2 = "",
  category = "",
  relation = "",
  addedOn = "",
  profileImage = "",
  onEdit,
  onRemove,
  onImageUpload,
  isEmpty,
  categoryData
}) => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [nomineeAssets, setNomineeAssets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCategoryClick = (category) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const handleViewAssets = () => {
    if (isEmpty) return;

    const assets = [];
    Object.keys(categoryData).forEach(category => {
      const categoryItems = categoryData[category]?.records || categoryData[category]?.ids || [];
      categoryItems.forEach(item => {
        let nomineeContact;

        if (category === "Password Management") {
          nomineeContact = item.nominee_contact || item.first_name;
        } else if (category === "Email Accounts") {
          nomineeContact = item.nomineeContact || item.first_name;
        } else if (category === "Devices") {
          nomineeContact = item.contact;
        } else {
          nomineeContact = item.nominee_contact || item.nomineeContact || item.contact;
        }
        if (
          nomineeContact &&
          (
            (nomineeContact.toLowerCase() === name?.toLowerCase() ||
              email && nomineeContact.toLowerCase() === email?.toLowerCase())
          )
        ) {
          assets.push({
            category,
            ...item
          });
        }
      });
    });
    setNomineeAssets(assets);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setNomineeAssets([]);
    setSelectedCategory(null);
  };

  const handleNavigate = (category) => {
    switch (category) {
      case "Home":
      case "Home Insurance":
      case "Vehicle":
      case "Storage facilities":
      case "Safe Deposit Boxes":
      case "Home Safes":
      case "Other important possessions":
      case "Other Real State":
      case "Other Insurance":
        navigate("/home-property-info");
        break;
      case "Credit Card":
      case "Loan":
      case "Home Insurance":
      case "Advisor and Agents":
      case "Life Insurance":
      case "Disability Insurance":
      case "Tax Return":
      case "Other Annuities or Benefits":
      case "Pension":
      case "Military Benefits":
      case "Disability Benefits":
      case "Rewards and Miles":
      case "Other Government Benefits":
        navigate("/financial-info");
        break;
      case "Pets":
      case "Physical & Antique Photos":
      case "Family Recipes":
        navigate("/family-loved-one-info");
        break;
      case "Attorneys":
      case "Will":
      case "Power of Attorneys":
      case "Trusts":
      case "Other Legal Documents":
        navigate("/legal-info");
        break;
      case "Final Arrangements":
      case "About My Life":
      case "My Secret":
        navigate("/after-gone-info");
        break;
      case "Government Id":
      case "Military Service":
      case "Miscellaneous":
      case "Charities & Causes":
      case "Employment Details":
      case "Clubs and Affiliations":
      case "Degrees and Certifications":
        navigate("/personal-info");
        break;
      default:
        navigate("/digital-info");
    }
  };

  const handleImageUpload = async (event) => {
    if (isEmpty) return;
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);
    formData.append("nomineeId", id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload-nominee-image`,
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
        onImageUpload(id, data.imagePath);
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
          title,
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
      case "Send Invite":
        toast.success("Invite sent successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
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
            <label
              htmlFor={`avatar-upload-${id}`}
              className="nominee-add-avatar-upload"
            >
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
            <h3 className="nominee-add-name-add-nominee">{name || "Not Assigned"}</h3>
            <div className="nominee-add-options-add-nominee" onClick={() => setShowOptions(!showOptions)}>
              ...
              {showOptions && (
                <div className="nominee-add-options-menu-add-nominee">
                  <button className="nominee-add-option-add-nominee" onClick={() => handleOptionClick("Send Invite")}>
                    Send Invite
                  </button>
                  <button className="nominee-add-option-add-nominee" onClick={() => handleOptionClick("Edit")}>
                    Edit
                  </button>
                  <button className="nominee-add-option-add-nominee" onClick={() => handleOptionClick("Delete")}>
                    Delete
                  </button>
                  <button className="nominee-add-option-add-nominee" onClick={() => handleOptionClick("View Assets")}>
                    View Assets
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="nominee-add-relation-add-nominee">{relationshipDisplay}</p>
        </div>
      </div>
      <div className="nominee-add-contact-info-add-nominee">
        <p className="nominee-add-info-add-nominee">
          <span className="nominee-add-info-label-add-nominee">Phone</span>
          <br />
          {phone_number || "-"}
        </p>
        <p className="nominee-add-info-add-nominee">
          <span className="nominee-add-info-label-add-nominee">Email</span>
          <br />
          {email || "-"}
        </p>
      </div>
      {showActions && (
        <div className="nominee-add-actions-wrapper-add-nominee">
          <div className="nominee-add-actions-add-nominee">
            <button
              className="nominee-add-button-add-nominee nominee-add-button-view-assets-add-nominee"
              onClick={handleViewAssets}
              disabled={isEmpty}
            >
              <img
                src={eyeIcon}
                alt="View Assets"
                className="nominee-add-button-icon-add-nominee"
              />{" "}
              View Assets
            </button>
          </div>
        </div>
      )}

      {isPopupOpen && (
        <div className="nominee-add-popup-overlay nominee-add">
          <div className="nominee-add-popup-content nominee-add">
            <div className="nominee-add-popup-header">
              <h2 className="nominee-add-asset-title">Assets for {name || title}</h2>
              <span className="nominee-add-asset-count">{nomineeAssets.length} {nomineeAssets.length === 1 ? "Asset" : "Assets"}</span>
            </div>
            {nomineeAssets.length > 0 ? (
              <>
                <div className="nominee-add-assets-grid">
                  {Object.entries(
                    nomineeAssets.reduce((acc, asset) => {
                      if (!acc[asset.category]) {
                        acc[asset.category] = [];
                      }
                      acc[asset.category].push(asset);
                      return acc;
                    }, {})
                  ).map(([category, assets], index) => (
                    <div className="nominee-add-assets-grid-item" key={index}>
                      <div
                        className="nominee-add-assets-header clickable"
                        onClick={() => handleCategoryClick(category)}
                      >
                        <span className="nominee-add-assets-category">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                        <span className="nominee-add-assets-count">{assets.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedCategory && (
                  <div className="nominee-add-assets-details">
                    <h3 className="nominee-add-assets-details-title">
                      {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </h3>
                    {nomineeAssets
                      .filter(asset => asset.category === selectedCategory)
                      .map((asset, i) => {
                        const displayName =
                          asset.nominee_contact ||
                          asset.first_name ||
                          asset.service_name ||
                          asset.name ||
                          asset.title ||
                          asset.ownership ||
                          asset.insuranceCompany ||
                          asset.facilityName ||
                          asset.bankName ||
                          asset.safeLocation ||
                          asset.itemName ||
                          asset.propertyType ||
                          asset.insuranceType ||
                          asset.cardType ||
                          asset.loanType ||
                          asset.advisorType ||
                          asset.policyType ||
                          asset.taxYear?.split("-")?.[0] ||
                          asset.annuityType ||
                          asset.adminPension ||
                          asset.disabilitySource ||
                          asset.adminContact ||
                          asset.rewardType ||
                          asset.govBenefitType ||
                          asset.petType ||
                          asset.photoLocation ||
                          asset.recipeName ||
                          asset.attorneyType ||
                          asset.pass_file ||
                          asset.poaType ||
                          asset.trustName ||
                          asset.documentName ||
                          asset.howCremated ||
                          asset.lifeThoughts ||
                          asset.notes ||
                          asset.type ||
                          asset.military_branch ||
                          asset.item ||
                          asset.charity_name ||
                          asset.employment_benefit ||
                          asset.club_contact ||
                          asset.university_name ||
                          "NA";
                        const createdAt = asset.created_at
                          ? new Date(asset.created_at).toLocaleDateString()
                          : "-";

                        return (
                          <div key={i} className="nominee-add-asset-item">
                            <div className="nominee-add-asset-details">
                              <p className="nominee-add-asset-name">{displayName}</p>
                              <p className="nominee-add-asset-date">{createdAt}</p>
                            </div>
                            <button
                              className="nominee-add-button-view-details"
                              onClick={() => handleNavigate(selectedCategory)}
                            >
                              View
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            ) : (
              <p className="nominee-add-no-assets">No assets allocated to this nominee.</p>
            )}
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
  onCancel,
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    contact: null,
    middleName: "",
    lastName: "",
    email: "",
    phone_number: "",
    phone_number1: "",
    phone_number2: "",
    category: "",
    relation: "",
    profileImage: "",
  });
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [showRelationInput, setShowRelationInput] = useState(false);
  const [customRelation, setCustomRelation] = useState("");
  const [allContacts, setAllContacts] = useState([]);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (editNominee) {
      const nameParts = editNominee.name ? editNominee.name.split(" ") : ["", "", ""];
      setFormData({
        firstName: nameParts[0] || "",
        middleName: nameParts.length > 2 ? nameParts[1] : "",
        contact: {
          value: editNominee?.phone_number,
          label: editNominee?.name,
        },
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
        email: editNominee.email,
        phone_number: editNominee.phone_number || "",
        phone_number1: editNominee.phone_number1 || "",
        phone_number2: editNominee.phone_number2 || "",
        category: editNominee.category || "",
        relation: editNominee.relation || "",
        profileImage: editNominee.profileImage || "",
      });
      setShowPhone1(!!editNominee.phone_number1);
      setShowPhone2(!!editNominee.phone_number2);
      setShowRelationInput(editNominee.category === "Family");
      setCustomRelation(editNominee.relation || "");
      setImagePreview(editNominee.profileImage ? `${import.meta.env.VITE_API_URL}${editNominee.profileImage.startsWith("/") ? "" : "/"}${editNominee.profileImage}` : null);
    } else {
      setFormData({
        firstName: "",
        contact: null,
        middleName: "",
        lastName: "",
        email: "",
        phone_number: "",
        phone_number1: "",
        phone_number2: "",
        category: "",
        relation: "",
        profileImage: "",
      });
      setShowPhone1(false);
      setShowPhone2(false);
      setShowRelationInput(false);
      setCustomRelation("");
      setImagePreview(null);
    }
  }, [editNominee]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? {
        relation: value === "Family" ? prev.relation : "",
        category: value
      } : {})
    }));
    if (name === "category") {
      setShowRelationInput(value === "Family");
      if (value !== "Family") {
        setCustomRelation("");
      }
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
      const url = editNominee
        ? `${import.meta.env.VITE_API_URL}/api/update-nominee/${editNominee.id}`
        : `${import.meta.env.VITE_API_URL}/api/add-nominee`;
      const method = editNominee ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (data.success) {
        if (editNominee) {
          onEditNominee({ ...submitData, id: editNominee.id });
          toast.success("Nominee updated successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          onNomineeAdded({ ...data.nominee, name: fullName });
          toast.success("Nominee added successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
        setFormData({
          firstName: "",
          contact: null,
          middleName: "",
          lastName: "",
          email: "",
          phone_number: "",
          phone_number1: "",
          phone_number2: "",
          category: "",
          relation: "",
          profileImage: "",
        });
        setShowPhone1(false);
        setShowPhone2(false);
        setShowRelationInput(false);
        setCustomRelation("");
        setImagePreview(null);
        onClose();
      } else {
        toast.error(data.message || "Failed to save nominee", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error saving nominee:", err);
      toast.error("Error saving nominee. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
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

  const contacts = allContacts?.map(item => {
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
      relation: item.relation
    };
  });

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
        borderColor: "#e9e6ff"
      },
      minHeight: "30px",
      borderRadius: "5px"
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#2684FF"
        : state.isFocused
          ? "#f0f8ff"
          : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      padding: 10
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333"
    })
  };

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
                    lastName: selectedOption?.lName || "",
                    middleName: selectedOption?.mName || "",
                    email: selectedOption?.email || "",
                    phone_number: selectedOption?.phone || ""
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
    setCustomRelation(value); // or value + " Giannis Antetokounmpo" if intentional
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
                <label
                  htmlFor="avatar-upload-form"
                  className="nominee-add-avatar-upload"
                >
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
  const [categoryData, setCategoryData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllCategoryData = async () => {
      const baseUrl = import.meta.env.VITE_API_URL;
      const categoryEndpoints = {
        "Password Management": "/api/get-password-details",
        "Email Accounts": "/api/get-email-details",
        "Devices": "/api/get-device-details",
        "Wifi": "/api/get-wifi-details",
        "Social Media": "/api/get-social-details",
        "Shopping/e-commerce": "/api/get-shopping-details",
        "Video streaming": "/api/get-video-details",
        "Music": "/api/get-music-details",
        "Gaming": "/api/get-gaming-details",
        "Cloud Storage": "/api/get-cloud-details",
        "Business & Networking": "/api/get-business-details",
        "Software & App licence": "/api/get-software-details",
        "Domains & Web Hosting": "/api/get-domain-details",
        "Other Subscription and Service": "/api/get-other-details",
        "Home": "/api/get-homes-details",
        "Home Insurance": "/api/get-home-insurance-details",
        "Vehicle": "/api/get-vehicle-insurance-details",
        "Storage facilities": "/api/get-storage-facilities-details",
        "Safe Deposit Boxes": "/api/get-safe-deposit-details",
        "Home Safes": "/api/get-home-safes-details",
        "Other important possessions": "/api/get-possessions-details",
        "Other Real State": "/api/get-other-real-estate-details",
        "Other Insurance": "/api/get-other-insurance-details",
        "Credit Card": "/api/get-credit-cards-details",
        "Loan": "/api/get-loans-details",
        "Advisor and Agents": "/api/get-advisor-agent-details",
        "Life Insurance": "/api/get-life-insurance-details",
        "Disability Insurance": "/api/get-disability-insurance-details",
        "Tax Return": "/api/get-tax-returns-details",
        "Other Annuities or Benefits": "/api/get-other-annuities-benefits-details",
        "Pension": "/api/get-pensions-details",
        "Military Benefits": "/api/get-military-benefits-details",
        "Disability Benefits": "/api/get-disability-benefits-details",
        "Rewards and Miles": "/api/get-miles-reward-details",
        "Other Government Benefits": "/api/get-government-benefit-details",
        "Pets": "/api/get-pets-details",
        "Physical & Antique Photos": "/api/get-physical-photos-details",
        "Family Recipes": "/api/get-family-recipes-details",
        "Attorneys": "/api/get-attorneys-details",
        "Will": "/api/get-wills-details",
        "Power of Attorneys": "/api/get-power-of-attorney-details",
        "Trusts": "/api/get-trusts-details",
        "Other Legal Documents": "/api/get-other-legal-documents-details",
        "Final Arrangements": "/api/get-final-arrangement-details",
        "About My Life": "/api/get-about-my-life-details",
        "My Secret": "/api/get-my-secret-details",
        "Government Id": "/api/get-government-ids",
        "Military Service": "/api/get-military-details",
        "Miscellaneous": "/api/get-miscellaneous-details",
        "Charities & Causes": "/api/get-charity-details",
        "Employment Details": "/api/employment-detail",
        "Clubs and Affiliations": "/api/get-club-details",
        "Degrees and Certifications": "/api/get-degree-details",
      };

      const fetchPromises = Object.entries(categoryEndpoints).map(
        async ([category, endpoint]) => {
          try {
            const res = await fetch(`${baseUrl}${endpoint}`, {
              credentials: "include",
            });
            const data = await res.json();
            return { category, data };
          } catch (err) {
            console.error(`Error fetching ${category}:`, err);
            return { category, data: { success: false, records: [] } };
          }
        }
      );

      const results = await Promise.all(fetchPromises);
      const dataMap = results.reduce((acc, { category, data }) => {
        acc[category] = data;
        return acc;
      }, {});

      setCategoryData(dataMap);
    };

    fetchAllCategoryData();
  }, []);

  const fetchNominees = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/get-nominees`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setNominees(data.nominees || []);
      } else {
        toast.error(data.message || "Failed to fetch nominees", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error fetching nominees:", err);
      toast.error("Error fetching nominees. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  }, []);

  useEffect(() => {
    fetchNominees();
  }, [fetchNominees]);

  const handleNomineeAdded = async () => {
    await fetchNominees();
    setShowForm(false);
  };

  const handleEditNominee = (nominee) => {
    setEditNominee(nominee);
    setShowForm(true);
  };

  const handleUpdateNominee = async () => {
    await fetchNominees();
    setEditNominee(null);
    setShowForm(false);
  };

  const handleRemoveNominee = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/remove-nominee/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchNominees();
        toast.success("Nominee removed successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(data.message || "Failed to remove nominee", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error removing nominee:", err);
      toast.error("Error removing nominee. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleImageUpload = (id, imagePath) => {
    setNominees((prev) =>
      prev.map((nominee) =>
        nominee.id === id
          ? { ...nominee, profile_image: imagePath }
          : nominee
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
    setShowForm(true);
  };

  const nomineeSlots = [
    nominees[0] || {},
    nominees[1] || {},
    nominees[2] || {},
    nominees[3] || {},
    nominees[4] || {},
  ];

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
        Manage your trusted contacts who can access your information in case
        of an emergency
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
              title={`Nominee ${index + 1}`}
              name={nominee.first_name}
              email={nominee.email}
              phone_number={nominee.phone_number}
              phone_number1={nominee.phone_number1}
              phone_number2={nominee.phone_number2}
              category={nominee.category}
              relation={nominee.relation}
              profileImage={nominee.profile_image}
              addedOn={
                nominee.created_at
                  ? new Date(nominee.created_at).toLocaleDateString()
                  : ""
              }
              onEdit={handleEditNominee}
              onRemove={handleRemoveNominee}
              onImageUpload={handleImageUpload}
              isEmpty={!nominee.id}
              categoryData={categoryData}
            />
          ))}
        </div>
      </div>
      {showForm && (
        <AddNomineeForm
          onNomineeAdded={handleNomineeAdded}
          onEditNominee={handleUpdateNominee}
          editNominee={editNominee}
          onCancel={handleCancel}
          isOpen={showForm}
          onClose={handleCancel}
        />
      )}
    </div>
  );
};

export default Nominee;
import React, { useState, useEffect, useRef } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import axios from "axios";
import vCard from 'vcards-js';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import "./Contact.css";
import folderIcon from "../../../assets/images/Contact/folder.svg";
import GoogleIcon from "../../../assets/images/Contact/Google.svg";
import CustomIcon from "../../../assets/images/Contact/Custom.svg";
import PhoneIcon from "../../../assets/images/Contact/Smartphone.svg";
import VFCIcon from "../../../assets/images/Contact/VFC.svg";
import cameraIcon from "../../../assets/images/dash_icon/camera.svg";
import uploadFileIcon from "../../../assets/images/dash_icon/upload.svg";
import debounce from 'lodash.debounce';
import ViewContact from "./ViewContact";
import FilterDropdown from "./FilterDropdown";
import deleteIcon from "../../../assets/images/Contact/Tuning.svg"; 
const OPENCAGE_API_KEY = "4cd0370d3cee487181c2d52e3fc22370";

const CategorizeDropdown = ({
  selectedContacts,
  contacts,
  setSelectedContacts,
  fetchContacts,
  categoryDropdownRef,
  relationDropdownRef,
  roleDropdownRef,
  categoryOptions,
  relationOptions,
  fetchedCategories,
  fetchedRelations,
}) => {
  const [categorizeData, setCategorizeData] = useState({
    category: "",
    relation: "",
    isAmbassador: false,
    isNominee: false,
  });
  const [customRelation, setCustomRelation] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showCustomRelationInput, setShowCustomRelationInput] = useState(false);
  const [showCategorizeConfirm, setShowCategorizeConfirm] = useState(false);

  const handleCategorize = async (
    category,
    relation = "",
    isAmbassador = false,
    isNominee = false
  ) => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to categorize.", {
        autoClose: 3000,
      });
      return;
    }

    const finalCategory = category === "Custom" ? customCategory.trim() : category;
    const finalRelation = relation === "Custom" ? customRelation.trim() : relation;

    if (category === "Custom" && !finalCategory) {
      toast.error("Please enter a custom category.", { autoClose: 3000 });
      return;
    }
    if (relation === "Custom" && !finalRelation) {
      toast.error("Please enter a custom relation.", { autoClose: 3000 });
      return;
    }

    try {
      const contactIds = selectedContacts;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/categorize-contacts`,
        {
          contactIds,
          category: finalCategory,
          relation: finalRelation,
          isAmbassador,
          isNominee,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(`Contacts categorized successfully`, {
          autoClose: 3000,
        });
        await fetchContacts();
        setSelectedContacts([]);
        setCategorizeData({
          category: "",
          relation: "",
          isAmbassador: false,
          isNominee: false,
        });
        setCustomCategory("");
        setCustomRelation("");
        setShowCategoryDropdown(false);
        setShowRelationDropdown(false);
        setShowRoleDropdown(false);
        setShowCustomCategoryInput(false);
        setShowCustomRelationInput(false);
      } else {
        toast.error(response.data.message, { autoClose: 3000 });
      }
    } catch (err) {
      toast.error("Failed to categorize contacts: " + err.message, {
        autoClose: 3000,
      });
    }
  };

  const handleCategorySelect = (category) => {
    if (category === "Custom") {
      setShowCustomCategoryInput(true);
      setShowCategoryDropdown(true);
      setShowRelationDropdown(false);
      setShowRoleDropdown(false);
      setCustomCategory("");
    } else {
      setCategorizeData((prev) => ({
        ...prev,
        category,
        relation: "",
        isAmbassador: false,
        isNominee: false,
      }));
      setCustomCategory("");
      setCustomRelation("");
      setShowCategoryDropdown(true);
      setShowRelationDropdown(category === "Family");
      setShowRoleDropdown(true);
      setShowCustomCategoryInput(false);
      setShowCustomRelationInput(false);
    }
  };

  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
  };

  const handleCustomCategoryConfirm = () => {
    if (customCategory.trim()) {
      setCategorizeData((prev) => ({ ...prev, category: "Custom" }));
      setShowCustomCategoryInput(false);
      setShowCategoryDropdown(true);
      setShowRelationDropdown(false);
      setShowRoleDropdown(true);
    } else {
      toast.error("Please enter a custom category.", { autoClose: 3000 });
    }
  };

  const handleRelationSelect = (relation) => {
    if (relation === "Custom") {
      setShowCustomRelationInput(true);
      setShowRelationDropdown(true);
      setShowRoleDropdown(false);
      setCustomRelation("");
    } else {
      setCategorizeData((prev) => ({
        ...prev,
        relation: prev.category === "Family" ? relation : "",
        isAmbassador: false,
        isNominee: false,
      }));
      setShowRelationDropdown(true);
      setShowRoleDropdown(true);
      setCustomRelation("");
      setShowCustomRelationInput(false);
    }
  };

  const handleCustomRelationChange = (e) => {
    setCustomRelation(e.target.value);
  };

  const handleCustomRelationConfirm = () => {
    if (customRelation.trim()) {
      setCategorizeData((prev) => ({ ...prev, relation: "Custom" }));
      setShowCustomRelationInput(false);
      setShowRelationDropdown(true);
      setShowRoleDropdown(true);
    } else {
      toast.error("Please enter a custom relation.", { autoClose: 3000 });
    }
  };

  const handleRoleChange = (role) => {
    if (role === "none") {
      setCategorizeData((prev) => ({
        ...prev,
        isAmbassador: false,
        isNominee: false,
      }));
      setShowCategorizeConfirm(true);
    } else {
      setCategorizeData((prev) => ({
        ...prev,
        [role]: !prev[role],
        category: prev.category || "Other",
        relation: prev.category === "Family" ? prev.relation : "",
      }));
    }
  };

  const handleRoleConfirm = () => {
    setShowCategorizeConfirm(true);
  };

  const confirmCategorize = () => {
    const { category, relation, isAmbassador, isNominee } = categorizeData;
    handleCategorize(
      category === "Custom" ? customCategory : category || "Other",
      category === "Family" && relation === "Custom"
        ? customRelation
        : category === "Family"
        ? relation
        : "",
      isAmbassador,
      isNominee
    );
    setShowCategorizeConfirm(false);
  };

  const cancelCategorize = () => {
    setShowCategorizeConfirm(false);
    setShowCategoryDropdown(false);
    setShowRelationDropdown(false);
    setShowRoleDropdown(false);
    setShowCustomCategoryInput(false);
    setShowCustomRelationInput(false);
  };

  const getCategoryDisplay = () => {
    const { category, relation, isAmbassador, isNominee } = categorizeData;
    const finalCategory = category === "Custom" ? customCategory.trim() : category || "Other";
    const finalRelation =
      category === "Family" && relation === "Custom"
        ? customRelation.trim()
        : category === "Family"
        ? relation
        : "";
    const parts = [finalCategory];
    if (finalRelation) parts.push(finalRelation);
    if (isAmbassador) parts.push("Ambassador");
    if (isNominee) parts.push("Nominee");
    return parts.length > 0 ? parts.join("/") : "None";
  };

  const getContactNames = () => {
    const selectedContactNames = selectedContacts
      .map((id) => {
        const contact = contacts.find((c) => c.id === id);
        if (!contact) return null;
        return [contact.first_name, contact.middle_name, contact.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || "Unknown";
      })
      .filter(Boolean);
    return selectedContactNames.length > 0
      ? selectedContactNames.join(", ")
      : "selected contacts";
  };

  return (
    <div className="add-contact-action-dropdown" ref={categoryDropdownRef}>
      <button
        className="contact-header-button"
        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
      >
        Category <span className="dropdown-icon">⏷</span>
      </button>
      {showCategoryDropdown && (
        <div className="add-contact-categorize-options">
          {categoryOptions.map((option) => (
            <div
              key={option}
              className={`add-contact-categorize-option ${
                categorizeData.category === option ? "selected" : ""
              }`}
              onClick={() => handleCategorySelect(option)}
            >
              {option}
              {categorizeData.category === option &&
                option !== "Family" &&
                !showCustomCategoryInput && (
                  <span className="add-contact-checkmark">✔</span>
                )}
            </div>
          ))}
          <div
            className="add-contact-categorize-option"
            onClick={() => handleCategorySelect("Custom")}
          >
            Custom
            {categorizeData.category === "Custom" && !showCustomCategoryInput && (
              <span className="add-contact-checkmark">✔</span>
            )}
          </div>
          {showCustomCategoryInput && (
            <div className="add-contact-custom-input-container">
              <input
                type="text"
                className="add-contact-form-input"
                placeholder="Enter custom category"
                value={customCategory}
                onChange={handleCustomCategoryChange}
                autoFocus
              />
              <button
                className="add-contact-custom-confirm"
                onClick={handleCustomCategoryConfirm}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
      {showRelationDropdown && categorizeData.category === "Family" && (
        <div
          className="add-contact-categorize-options add-contact-sub-options"
          ref={relationDropdownRef}
        >
          {relationOptions.map((option) => (
            <div key={option}>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={
                    option === "Custom"
                      ? showCustomRelationInput
                      : categorizeData.relation === option
                  }
                  onChange={() => handleRelationSelect(option)}
                />
                {option}
              </label>
            </div>
          ))}
          <div>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={showCustomRelationInput}
                onChange={() => handleRelationSelect("Custom")}
              />
              Custom
            </label>
            {showCustomRelationInput && (
              <div className="add-contact-custom-input-container">
                <input
                  type="text"
                  className="add-contact-form-input"
                  placeholder="Enter custom relation"
                  value={customRelation}
                  onChange={handleCustomRelationChange}
                  autoFocus
                />
                <button
                  className="add-contact-custom-confirm"
                  onClick={handleCustomRelationConfirm}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </div>
        )}
        {showRoleDropdown &&
          (categorizeData.category &&
            (categorizeData.category !== "Family" ||
              categorizeData.relation ||
              (categorizeData.relation === "Custom" && customRelation))) && (
            <div
              className="add-contact-categorize-options add-contact-sub-options add-contact-sub-sub-options"
              ref={roleDropdownRef}
            >
              <div
                className="add-contact-categorize-option"
                onClick={() => handleRoleChange("none")}
              >
                None
                {!categorizeData.isAmbassador && !categorizeData.isNominee && (
                  <span className="add-contact-checkmark">✔</span>
                )}
              </div>
              <label className="add-contact-categorize-checkbox">
                <input
                  type="checkbox"
                  checked={categorizeData.isAmbassador}
                  onChange={() => handleRoleChange("isAmbassador")}
                />
                Ambassador
                {categorizeData.isAmbassador && (
                  <span className="add-contact-checkmark">✔</span>
                )}
              </label>
              <label className="add-contact-categorize-checkbox">
                <input
                  type="checkbox"
                  checked={categorizeData.isNominee}
                  onChange={() => handleRoleChange("isNominee")}
                />
                Nominee
                {categorizeData.isNominee && (
                  <span className="add-contact-checkmark">✔</span>
                )}
              </label>
              <div
                className="add-contact-categorize-option add-contact-confirm"
                onClick={handleRoleConfirm}
              >
                Confirm
              </div>
            </div>
          )}
        {showCategorizeConfirm && (
          <div className="delete-confirm-popup-backdrop">
            <div className="delete-confirm-popup">
              <button
                className="delete-confirm-close"
                onClick={cancelCategorize}
              >
                ×
              </button>
              <h3 className="delete-confirm-heading">Confirm Categorization</h3>
              <p className="delete-confirm-message">
                Are you sure you want to categorize {getContactNames()} as {getCategoryDisplay()}?.
              </p>
              <div className="delete-confirm-actions">
                <button
                  className="add-contact-form-button cancel"
                  onClick={cancelCategorize}
                >
                  Cancel
                </button>
                <button
                  className="add-contact-form-button save"
                  onClick={confirmCategorize}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

const Contact = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [supportsWebContacts, setSupportsWebContacts] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState([]);
  const [editingContactId, setEditingContactId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('ALL');

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    relations: [],
    sharedAfterPassAway: false,
    fetchedCategories: [], 
    fetchedRelations: [],
  });
  const [limit] = useState(20);
  const [customContact, setCustomContact] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    company: "",
    job_type: "",
    website: "",
    category: "",
    relation: "",
    phone_number: "",
    phone_number1: "",
    phone_number2: "",
    phone_number3: "",
    email: "",
    flat_building_no: "",
    street: "",
    country: "",
    state: "",
    city: "",
    postal_code: "",
    date_of_birth: "",
    anniversary: "",
    notes: "",
    contact_image: "",
    release_on_pass: false,
    is_ambassador: false,
    is_nominee: false,
    share_on: "",
    share_by: {
      whatsapp: false,
      sms: false,
      email: false,
    },
  });

  const [selectedLetter, setSelectedLetter] = useState('');
  const [clickedLetter, setClickedLetter] = useState('');

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const [customCountryId, setCustomCountryId] = useState(null);
  const [customStateId, setCustomStateId] = useState(null);
  const [customCityId, setCustomCityId] = useState(null);
  const [phoneCount, setPhoneCount] = useState(1);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [customRelation, setCustomRelation] = useState("");
  const [relationSearch, setRelationSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [addressSearch, setAddressSearch] = useState("");
  const [firstImageSrc, setFirstImageSrc] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const relationInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const categoryDropdownRef = useRef(null);
  const relationDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  const shareOnOptions = ["4 Days", "7 Days", "10 Days", "15 Days"];
  const [customShareOn, setCustomShareOn] = useState("");
  const [showShareOnDropdown, setShowShareOnDropdown] = useState(false);
  const shareOnInputRef = useRef(null);


  const categoryOptions = [...new Set(["Family", "Friends", "Work", ...filterOptions.fetchedCategories])];
  const relationOptions = [...new Set([
    "Son",
    "Daughter",
    "Wife",
    "Husband",
    "Father",
    "Mother",
    "Brother",
    "Sister",
    ...filterOptions.fetchedRelations
  ])];
  const maxFileSize = 5 * 1024 * 1024;
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
  const allowedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const extensionToMimeType = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  const fetchContacts = async (page = 1, filterType = "ALL", search = "", filters = {}) => {
    try {
      const params = { filter: filterType };

      // Validate inputs
      if (typeof search !== "string") {
        console.warn("Invalid search query:", search);
        params.search = "";
      } else if (search.trim()) {
        params.search = search.trim();
      }

      // Validate filters
      const safeFilters = {
        categories: Array.isArray(filters.categories) ? filters.categories.filter(cat => typeof cat === "string") : [],
        relations: Array.isArray(filters.relations) ? filters.relations.filter(rel => typeof rel === "string") : [],
        sharedAfterPassAway: !!filters.sharedAfterPassAway,
      };

      if (
        safeFilters.categories.length > 0 ||
        safeFilters.relations.length > 0 ||
        safeFilters.sharedAfterPassAway
      ) {
        params.all = true; 
      } else {
        params.page = Number.isInteger(page) && page > 0 ? page : 1;
        params.limit = Number.isInteger(limit) && limit > 0 ? limit : 20;
      }

      
      const predefinedCategories = safeFilters.categories.filter((cat) =>
        ["Family", "Friends", "Work"].includes(cat)
      );
      const customCategory = safeFilters.categories.find(
        (cat) => !["Family", "Friends", "Work"].includes(cat)
      );

      if (predefinedCategories.length > 0) {
        params.categories = predefinedCategories.join(",");
      }
      if (customCategory) {
        params.category_like = customCategory.trim();
      }

      
      const predefinedRelations = safeFilters.relations.filter((rel) =>
        [
          "Son",
          "Daughter",
          "Wife",
          "Husband",
          "Father",
          "Mother",
          "Brother",
          "Sister",
        ].includes(rel)
      );
      const customRelation = safeFilters.relations.find(
        (rel) =>
          ![
            "Son",
            "Daughter",
            "Wife",
            "Husband",
            "Father",
            "Mother",
            "Brother",
            "Sister",
          ].includes(rel)
      );

      if (predefinedRelations.length > 0) {
        params.relations = predefinedRelations.join(",");
      }
      if (customRelation) {
        params.relation_like = customRelation.trim();
      }

      if (safeFilters.sharedAfterPassAway) {
        params.release_on_pass = 1; 
      }

      console.log("Fetching contacts with params:", params);

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        params,
        withCredentials: true,
      });

      console.log("API response:", response.data);

      if (response.data.success) {
        
        const normalizedContacts = Array.isArray(response.data.contacts)
          ? response.data.contacts.map(contact => ({
            ...contact,
            release_on_pass: contact.release_on_pass === 1 || contact.release_on_pass === true,
          }))
          : [];
        setContacts(normalizedContacts);
        setFilterOptions((prev) => ({
          ...prev,
          fetchedCategories: Array.isArray(response.data.categories) ? response.data.categories : [],
          fetchedRelations: Array.isArray(response.data.relations) ? response.data.relations : [],
        }));
        setCurrentPage(
          params.search || safeFilters.categories.length > 0
            ? 1
            : Number.isInteger(response.data.currentPage) && response.data.currentPage > 0
              ? response.data.currentPage
              : 1
        );
        setTotalPages(
          params.search || safeFilters.categories.length > 0
            ? 1
            : Number.isInteger(response.data.totalPages) && response.data.totalPages > 0
              ? response.data.totalPages
              : 1
        );
        setTotal(Number.isInteger(response.data.total) ? response.data.total : 0);
      } else {
        console.error("API error message:", response.data.message);
        toast.error(response.data.message || "Failed to fetch contacts", { autoClose: 3000 });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message ||
        "Unknown error";
      console.error("Error fetching contacts:", {
        error: errorMessage,
        status: err.response?.status,
        params,
        response: err.response?.data,
      });
      toast.error(`Failed to fetch contacts: ${errorMessage}`, { autoClose: 3000 });
    }
  };



  useEffect(() => {
    debouncedFetchContacts(searchQuery, filterOptions);
    return () => debouncedFetchContacts.cancel();
  }, [searchQuery, filterOptions]);

  useEffect(() => {
    const renderFirstImage = async () => {
      const firstImage = additionalFiles.find((file) =>
        allowedImageTypes.includes(file.type)
      );
      if (firstImage) {
        const reader = new FileReader();
        reader.onload = (e) => setFirstImageSrc(e.target.result);
        reader.readAsDataURL(firstImage);
      } else {
        setFirstImageSrc(null);
      }
    };
    renderFirstImage();
  }, [additionalFiles]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    setError("");
    setShowCustomForm(false);
  };

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsMobile(/android|iphone|ipad|ipod|mobile|tablet/.test(userAgent));
    setSupportsWebContacts("contacts" in navigator && "ContactsManager" in window);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError("");
      }
    });

    return () => unsubscribe();
  }, []);

  const syncWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      let allGoogleContacts = [];
      let nextPageToken = null;
      const pageSize = 1000;
      const maxRetries = 5;
      const baseDelay = 1000;

      const fetchContactsPage = async (pageToken = null, attempt = 1) => {
        try {
          const response = await axios.get(
            "https://people.googleapis.com/v1/people/me/connections",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              params: {
                personFields:
                  "names,emailAddresses,phoneNumbers,birthdays,events,addresses,organizations,urls",
                pageSize,
                pageToken: pageToken || undefined,
              },
            }
          );

          return {
            contacts: response.data.connections || [],
            nextPageToken: response.data.nextPageToken || null,
          };
        } catch (err) {
          if (err.response?.status === 429 && attempt <= maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            toast.warn(`Rate limit hit, retrying in ${delay / 1000}s...`, {
              autoClose: 3000,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchContactsPage(pageToken, attempt + 1);
          }
          throw err;
        }
      };

      const saveContactsBatch = async (contacts) => {
        if (contacts.length === 0) return;

        try {
          const saveResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/contacts/save`,
            { contacts, source: "google" },
            { withCredentials: true }
          );

          if (!saveResponse.data.success) {
            toast.error(saveResponse.data.message, { autoClose: 3000 });
          }
          if (saveResponse.data.skipped?.length > 0) {
            saveResponse.data.skipped.forEach((skipped) => {
              toast.error(skipped.reason, { autoClose: 3000 });
            });
          }
          await fetchContacts();
        } catch (saveErr) {
          toast.error(`Failed to save contacts batch: ${saveErr.message}`, {
            autoClose: 3000,
          });
        }
      };

      let pageNumber = 1;
      do {
        toast.info(`Fetching page ${pageNumber} of contacts...`, {
          autoClose: 2000,
        });

        const { contacts, nextPageToken: newPageToken } = await fetchContactsPage(
          nextPageToken
        );

        const formattedContacts = contacts
          .filter((contact) => contact.phoneNumbers?.length > 0)
          .map((contact) => {
            const phoneNumbers = contact.phoneNumbers
              .map((phone) => {
                let number = phone.value.replace(/[\s-()]/g, "");
                const parsedNumber = parsePhoneNumberFromString(number, "IN");
                if (parsedNumber && parsedNumber.isValid()) {
                  return parsedNumber.formatInternational();
                } else if (number.startsWith("+")) {
                  return number;
                } else {
                  toast.warn(
                    `Phone number ${number} for ${contact.names?.[0]?.displayName || "Unknown"
                    } is not in international format. Assuming +91.`,
                    { autoClose: 3000 }
                  );
                  return `+91${number}`;
                }
              })
              .filter((num) => num && typeof num === "string" && num.trim() !== "");

            const address = contact.addresses?.[0] || {};
            const name = contact.names?.[0] || {};
            const organization = contact.organizations?.[0] || {};
            const website = contact.urls?.[0]?.value || "";
            const birthday = contact.birthdays?.[0]?.date
              ? `${contact.birthdays[0].date.year || ""}-${String(
                contact.birthdays[0].date.month || ""
              ).padStart(2, "0")}-${String(
                contact.birthdays[0].date.day || ""
              ).padStart(2, "0")}`
              : "";
            const anniversary = contact.events?.find(
              (e) => e.type === "anniversary"
            )?.date
              ? `${contact.events[0].date.year || ""}-${String(
                contact.events[0].date.month || ""
              ).padStart(2, "0")}-${String(
                contact.events[0].date.day || ""
              ).padStart(2, "0")}`
              : "";

            return {
              first_name: name.givenName || "",
              middle_name: "",
              last_name: name.familyName || "",
              company: organization.name || "",
              job_type: organization.title || "",
              website,
              category: "",
              relation: "",
              phone_number: phoneNumbers[0] || "",
              phone_number1: phoneNumbers[1] || "",
              phone_number2: phoneNumbers[2] || "",
              phone_number3: phoneNumbers[3] || "",
              email: contact.emailAddresses?.[0]?.value || "",
              flat_building_no: "",
              street: address.streetAddress || "",
              country: address.country || "",
              state: address.region || "",
              city: address.city || "",
              postal_code: address.postalCode || "",
              date_of_birth: birthday,
              anniversary: anniversary,
              notes: "",
              contact_image: "",
              release_on_pass: false,
              is_ambassador: false,
              is_nominee: false,
            };
          });

        allGoogleContacts = [...allGoogleContacts, ...formattedContacts];
        await saveContactsBatch(formattedContacts);
        nextPageToken = newPageToken;
        pageNumber++;

        if (nextPageToken) {
          await new Promise((resolve) => setTimeout(resolve, baseDelay));
        }
      } while (nextPageToken);

      if (allGoogleContacts.length === 0) {
        toast.info("No contacts found in this Google account.", {
          autoClose: 3000,
        });
        toggleDrawer();
        return;
      }

      setError("");
      toggleDrawer();
      toast.success(`Successfully synced ${allGoogleContacts.length} contacts`, {
        autoClose: 3000,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(`Failed to sync Google contacts: ${errorMessage}`);
      toast.error(`Failed to sync Google contacts: ${errorMessage}`, {
        autoClose: 3000,
      });
    }
  };

  const syncPhoneDirectly = async () => {
    if (!isMobile) {
      toast.error("Mobile sync is only available on mobile devices.", {
        autoClose: 3000,
      });
      return;
    }
    if (!supportsWebContacts) {
      toast.error("Direct phone sync is not supported in this browser.", {
        autoClose: 3000,
      });
      return;
    }

    try {
      const props = ["name", "tel", "email"];
      const opts = { multiple: true };
      const contacts = await navigator.contacts.select(props, opts);
      const phoneContactsData = contacts
        .filter((contact) => contact.tel && contact.tel.length > 0)
        .map((contact) => {
          const phoneNumbers = contact.tel
            .map((tel) => {
              let number = tel.replace(/[\s-()]/g, "");
              const parsedNumber = parsePhoneNumberFromString(number, "IN");
              if (parsedNumber && parsedNumber.isValid()) {
                return parsedNumber.formatInternational();
              }
              return number.startsWith("+") ? number : `+91${number}`;
            })
            .filter((num) => num && typeof num === "string" && num.trim() !== "");

          const nameParts = contact.name[0]?.split(" ") || ["Unknown"];
          return {
            first_name: nameParts[0] || "Unknown",
            middle_name:
              nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
            last_name:
              nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
            company: "",
            job_type: "",
            website: "",
            category: "",
            relation: "",
            phone_number: phoneNumbers[0] || "",
            phone_number1: phoneNumbers[1] || "",
            phone_number2: phoneNumbers[2] || "",
            phone_number3: phoneNumbers[3] || "",
            email: contact.email?.[0] || "",
            flat_building_no: "",
            street: "",
            country: "",
            state: "",
            city: "",
            postal_code: "",
            date_of_birth: "",
            anniversary: "",
            notes: "",
            contact_image: "",
            release_on_pass: false,
            is_ambassador: false,
            is_nominee: false,
          };
        });

      const saveResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/save`,
        { contacts: phoneContactsData, source: "mobile" },
        { withCredentials: true }
      );

      if (saveResponse.data.success) {
        toast.success(saveResponse.data.message, { autoClose: 3000 });
        if (saveResponse.data.skipped?.length > 0) {
          saveResponse.data.skipped.forEach((skipped) => {
            toast.error(skipped.reason, { autoClose: 3000 });
          });
        }
        await fetchContacts();
      } else {
        toast.error(saveResponse.data.message, { autoClose: 3000 });
        if (saveResponse.data.skipped?.length > 0) {
          saveResponse.data.skipped.forEach((skipped) => {
            toast.error(skipped.reason, { autoClose: 3000 });
          });
        }
      }

      setError("");
      toggleDrawer();
    } catch (err) {
      setError("Failed to sync phone contacts directly: " + err.message);
      toast.error("Failed to sync phone contacts: " + err.message, {
        autoClose: 3000,
      });
    }
  };

  const syncPhoneViaVcf = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setError("No file selected.");
      toast.error("No file selected.", { autoClose: 3000 });
      return;
    }

    const file = files[0]; // Process only the first file
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const vcfText = e.target.result;
          console.log("Raw VCF file content:", vcfText.substring(0, 500));

          // Normalize line endings and unfold lines
          let normalizedText = vcfText.replace(/\r\n|\r/g, '\n');
          normalizedText = normalizedText.replace(/\n\s+/g, '');

          // Split into vCard entries
          const vcfCards = normalizedText
            .split('BEGIN:VCARD\n')
            .filter(card => card.trim() && card.includes('END:VCARD'))
            .map(card => `BEGIN:VCARD\n${card.trim()}`);

          if (vcfCards.length === 0) {
            throw new Error("No valid vCard entries found in the VCF file. Ensure each vCard has BEGIN:VCARD and END:VCARD.");
          }

          console.log(`Found ${vcfCards.length} vCard entries`);

          let phoneContactsData = [];
          for (let i = 0; i < vcfCards.length; i++) {
            let cardText = vcfCards[i];
            try {
              console.log(`vCard ${i + 1} content:`, cardText);

              // Extract version for validation
              let versionMatch = cardText.match(/VERSION:([^\n\r]*)/i);
              let version = versionMatch ? versionMatch[1].trim() : null;

              // Handle invalid or missing version
              if (!['2.1', '3.0', '4.0'].includes(version)) {
                console.warn(`Invalid or missing version "${version || 'none'}" in vCard ${i + 1}. Defaulting to 3.0.`);
                toast.warn(`vCard ${i + 1} has invalid version "${version || 'none'}". Proceeding with manual parsing.`, { autoClose: 3000 });
                if (version) {
                  cardText = cardText.replace(/VERSION:[^\n\r]*/, 'VERSION:3.0');
                } else {
                  cardText = cardText.replace('BEGIN:VCARD\n', 'BEGIN:VCARD\nVERSION:3.0\n');
                }
              }

              // Manual parsing
              const lines = cardText.split('\n');
              let name = "", phoneNumbers = [], email = "", org = "", title = "", addressComponents = [], website = "", dateOfBirth = "", anniversary = "";
              for (const line of lines) {
                if (line.startsWith('FN:')) {
                  name = line.slice(3).trim();
                } else if (line.startsWith('N:')) {
                  const nParts = line.slice(2).split(';').filter(part => part.trim());
                  name = nParts.reverse().join(" ").trim() || name;
                } else if (line.startsWith('TEL')) {
                  const tel = line.split(':')[1]?.trim();
                  if (tel) phoneNumbers.push(tel);
                } else if (line.startsWith('EMAIL')) {
                  email = line.split(':')[1]?.trim() || "";
                } else if (line.startsWith('ORG')) {
                  org = line.split(':')[1]?.trim() || "";
                } else if (line.startsWith('TITLE')) {
                  title = line.split(':')[1]?.trim() || "";
                } else if (line.startsWith('ADR')) {
                  addressComponents = line.split(':')[1]?.split(';') || [];
                } else if (line.startsWith('URL')) {
                  website = line.split(':')[1]?.trim() || "";
                } else if (line.startsWith('BDAY')) {
                  dateOfBirth = line.split(':')[1]?.trim() || "";
                } else if (line.startsWith('ANNIVERSARY')) {
                  anniversary = line.split(':')[1]?.trim() || "";
                }
              }

              phoneNumbers = phoneNumbers
                .filter((tel) => tel && typeof tel === "string" && tel.trim() !== "")
                .map((tel) => {
                  let number = tel.replace(/[\s-()]/g, "");
                  const parsedNumber = parsePhoneNumberFromString(number);
                  if (parsedNumber && parsedNumber.isValid()) {
                    return parsedNumber.formatInternational();
                  } else {
                    return number;
                  }
                });

              if (phoneNumbers.length > 0) {
                const nameParts = name.split(" ").filter(part => part.trim());
                phoneContactsData.push({
                  first_name: nameParts[0] || "Unknown",
                  middle_name: nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
                  last_name: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
                  company: org,
                  job_type: title,
                  website,
                  category: "",
                  relation: "",
                  phone_number: phoneNumbers[0] || "",
                  phone_number1: phoneNumbers[1] || "",
                  phone_number2: phoneNumbers[2] || "",
                  phone_number3: phoneNumbers[3] || "",
                  email,
                  flat_building_no: addressComponents[0] || "",
                  street: addressComponents[1] || "",
                  city: addressComponents[2] || "",
                  state: addressComponents[3] || "",
                  country: addressComponents[4] || "",
                  postal_code: addressComponents[5] || "",
                  date_of_birth: dateOfBirth,
                  anniversary: anniversary,
                  notes: "",
                  contact_image: "",
                  release_on_pass: false,
                  is_ambassador: false,
                  is_nominee: false,
                });
                console.log(`Successfully parsed vCard ${i + 1}`);
              } else {
                console.warn(`Skipping vCard ${i + 1}: No valid phone numbers found.`);
                toast.warn(`Skipped vCard ${i + 1}: No valid phone numbers.`, { autoClose: 3000 });
              }
            } catch (parseErr) {
              console.error(`Error parsing vCard ${i + 1}:`, parseErr.message, cardText);
              toast.warn(`Skipped vCard ${i + 1}: ${parseErr.message}`, { autoClose: 3000 });
              continue;
            }
          }

          if (phoneContactsData.length === 0) {
            toast.info("No valid contacts with phone numbers found in the VCF file.", { autoClose: 3000 });
            toggleDrawer();
            return;
          }

          const saveResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/contacts/save`,
            { contacts: phoneContactsData, source: "vcf" },
            { withCredentials: true }
          );

          if (saveResponse.data.success) {
            toast.success(`Successfully imported ${saveResponse.data.contacts?.length || 0} contacts`, { autoClose: 3000 });
            if (saveResponse.data.skipped?.length > 0) {
              saveResponse.data.skipped.forEach((skipped) => {
                const contactName = [skipped.contact.first_name, skipped.contact.middle_name, skipped.contact.last_name]
                  .filter(Boolean)
                  .join(" ") || "Unknown";
                toast.error(`Skipped ${contactName}: ${skipped.reason}`, { autoClose: 5000 });
              });
            }
            await fetchContacts();
            toggleDrawer();
          } else {
            throw new Error(saveResponse.data.message || "Failed to save contacts");
          }
        } catch (err) {
          setError("Failed to process VCF file: " + err.message);
          toast.error("Failed to process VCF file: " + err.message, { autoClose: 3000 });
        }
      };
      reader.onerror = () => {
        setError("Failed to read the VCF file.");
        toast.error("Failed to read the VCF file.", { autoClose: 3000 });
      };
      reader.readAsText(file, 'UTF-8');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to sync VCF contacts: " + err.message);
      toast.error("Failed to sync VCF contacts: " + err.message, { autoClose: 3000 });
    }
  };

  const validateContact = (contact) => {
    if (!contact.first_name?.trim()) {
      return "First name is required.";
    }
    if (!contact.phone_number?.trim()) {
      return "At least one phone number is required.";
    }

    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      return "Invalid email format.";
    }
    if (
      contact.website &&
      !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(contact.website)
    ) {
      return "Invalid website URL.";
    }
    return null;
  };

  const validateFiles = (image, files) => {
    if (image) {
      if (!allowedImageTypes.includes(image.type)) {
        return "Profile image must be a JPEG, PNG, or GIF.";
      }
      if (image.size > maxFileSize) {
        return "Profile image must be less than 5MB.";
      }
    }
    for (const file of files) {
      if (!allowedFileTypes.includes(file.type)) {
        return `File ${file.name} must be a JPEG, PNG, GIF, PDF, DOC, or DOCX.`;
      }
      if (file.size > maxFileSize) {
        return `File ${file.name} must be less than 5MB.`;
      }
    }
    return null;
  };

  const handleAddOrUpdateContact = async () => {
    const {
      first_name,
      middle_name,
      last_name,
      company,
      job_type,
      website,
      category,
      relation,
      phone_number,
      phone_number1,
      phone_number2,
      phone_number3,
      email,
      flat_building_no,
      street,
      country,
      state,
      city,
      postal_code,
      date_of_birth,
      anniversary,
      notes,
      release_on_pass,
      share_on,
      share_by,
    } = customContact;

    const newContact = {
      id: editingContactId || undefined,
      first_name,
      middle_name,
      last_name,
      company,
      job_type,
      website,
      category,
      relation: customRelation || relation,
      phone_number,
      phone_number1,
      phone_number2,
      phone_number3,
      email,
      flat_building_no,
      street,
      country,
      state,
      city,
      postal_code,
      date_of_birth,
      anniversary,
      notes,
      contact_image: "",
      release_on_pass,
      is_ambassador: false,
      is_nominee: false,
      share_on: share_on || "",
      share_by: {
        whatsapp: share_by.whatsapp || false,
        sms: share_by.sms || false,
        email: share_by.email || false,
      },
      uploaded_files: existingFiles,
    };

    const validationError = validateContact(newContact);
    if (validationError) {
      setError(validationError);
      toast.error(validationError, { autoClose: 3000 });
      return;
    }

    const fileValidationError = validateFiles(profileImageFile, additionalFiles);
    if (fileValidationError) {
      setError(fileValidationError);
      toast.error(fileValidationError, { autoClose: 3000 });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("contacts", JSON.stringify([newContact]));
      formData.append("source", "custom");
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }
      additionalFiles.forEach((file) => {
        formData.append("additionalFiles", file);
      });

      const saveResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/save`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (saveResponse.data.success) {
        toast.success(saveResponse.data.message, { autoClose: 3000 });
        if (saveResponse.data.skipped?.length > 0) {
          saveResponse.data.skipped.forEach((skipped) => {
            toast.error(skipped.reason, { autoClose: 3000 });
          });
        }
        await fetchContacts();
        const savedContact = saveResponse.data.contacts?.[0];
        if (savedContact?.contact_image) {
          setCustomContact((prev) => ({
            ...prev,
            contact_image: `${import.meta.env.VITE_API_URL}${savedContact.contact_image}`,
            share_on: savedContact.share_on || "",
            share_by: {
              whatsapp: savedContact.share_by?.whatsapp || false,
              sms: savedContact.share_by?.sms || false,
              email: savedContact.share_by?.email || false,
            },
          }));
          setProfileImageFile(null);
        }
        setAdditionalFiles([]);
        setExistingFiles(savedContact?.uploaded_files || []);
        setFirstImageSrc(null);
      } else {
        throw new Error(saveResponse.data.message || "Failed to save contact");
      }

      closeCustomForm();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        `Failed to ${editingContactId ? "update" : "add"} contact: ${errorMessage}`
      );
      toast.error(
        `Failed to ${editingContactId ? "update" : "add"} contact: ${errorMessage}`,
        { autoClose: 3000 }
      );
    }
  };




  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactIdToDelete, setContactIdToDelete] = useState(null);

  const handleDeleteContact = (contactId) => {
    setContactIdToDelete(contactId);
    setShowDeleteConfirm(true);
  };
  const confirmDeleteContact = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/contacts/${contactIdToDelete}`,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 3000 });
        setContacts(contacts.filter((contact) => contact.id !== contactIdToDelete));
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Failed to delete contact: ${errorMessage}`);
      toast.error(`Failed to delete contact: ${errorMessage}`, {
        autoClose: 3000,
      });
    }
    setShowDeleteConfirm(false);
    setContactIdToDelete(null);
    setDropdownOpen(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact to delete.", {
        autoClose: 3000,
      });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedContacts.length} contact(s)?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/delete-contacts`,
        { contactIds: selectedContacts },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 3000 });
        await fetchContacts();
        setSelectedContacts([]);
      } else {
        toast.error(response.data.message || "Failed to delete contacts.", {
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error deleting selected contacts:", err);
      toast.error(
        `Failed to delete contacts: ${err.response?.data?.message || err.message}`,
        { autoClose: 3000 }
      );
    }
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact.id);
    setCustomContact({
      ...contact,
      contact_image: contact.contact_image
        ? `${import.meta.env.VITE_API_URL}${contact.contact_image}`
        : "",
      share_on: contact.share_on || "",
      share_by: {
        whatsapp: contact.share_by?.whatsapp || contact.share_by_whatsapp || false,
        sms: contact.share_by?.sms || contact.share_by_sms || false,
        email: contact.share_by?.email || contact.share_by_email || false,
      },
    });
    setAddressSearch(contact.flat_building_no || ""); 
    setProfileImageFile(null);
    setRelationSearch(contact.relation || "");
    setCategorySearch(contact.category || "");
    setJobTypeSearch(contact.job_type || "");
    setCustomRelation(contact.relation || "");
    setCustomShareOn(contact.share_on || "");
    setPhoneCount(
      1 +
      (contact.phone_number1 ? 1 : 0) +
      (contact.phone_number2 ? 1 : 0) +
      (contact.phone_number3 ? 1 : 0)
    );
    setExistingFiles(contact.uploaded_files || []);
    setAdditionalFiles([]);
    setFirstImageSrc(null);
    setShowCustomForm(true);
    setDropdownOpen(null);
  };

  const handleDeleteFile = async (fileId, contactId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/contacts/files/${fileId}`,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 3000 });
        setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? {
                ...c,
                uploaded_files: c.uploaded_files.filter((f) => f.id !== fileId),
              }
              : c
          )
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      toast.error(`Failed to delete file: ${errorMessage}`, { autoClose: 3000 });
    }
  };

  const handleAddPhoneNumber = () => {
    if (phoneCount < 4 && newPhone) {
      const parsedNumber = parsePhoneNumberFromString(newPhone, "IN");
      if (!parsedNumber || !parsedNumber.isValid()) {
        toast.error(
          "Additional phone number must be in a valid international format.",
          { autoClose: 3000 }
        );
        return;
      }
      if (phoneCount === 1) {
        setCustomContact((prev) => ({
          ...prev,
          phone_number1: newPhone,
        }));
      } else if (phoneCount === 2) {
        setCustomContact((prev) => ({
          ...prev,
          phone_number2: newPhone,
        }));
      } else if (phoneCount === 3) {
        setCustomContact((prev) => ({
          ...prev,
          phone_number3: newPhone,
        }));
      }
      setPhoneCount(phoneCount + 1);
      setNewPhone("");
      setShowPhonePopup(false);
    }
  };

  const removePhoneNumber = (numberToRemove) => {
    setCustomContact((prev) => {
      if (prev.phone_number1 === numberToRemove) {
        return {
          ...prev,
          phone_number1: prev.phone_number2,
          phone_number2: prev.phone_number3,
          phone_number3: "",
        };
      } else if (prev.phone_number2 === numberToRemove) {
        return { ...prev, phone_number2: prev.phone_number3, phone_number3: "" };
      } else if (prev.phone_number3 === numberToRemove) {
        return { ...prev, phone_number3: "" };
      }
      return prev;
    });
    setPhoneCount((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const closeCustomForm = () => {
    setShowCustomForm(false);

    setCustomContact({
      first_name: "",
      middle_name: "",
      last_name: "",
      company: "",
      job_type: "",
      website: "",
      category: "",
      relation: "",
      phone_number: "",
      phone_number1: "",
      phone_number2: "",
      phone_number3: "",
      email: "",
      flat_building_no: "",
      street: "",
      country: "",
      state: "",
      city: "",
      postal_code: "",
      date_of_birth: "",
      anniversary: "",
      notes: "",
      contact_image: "",
      release_on_pass: false,
      is_ambassador: false,
      is_nominee: false,
      share_on: "",
      share_by: {
        whatsapp: false,
        sms: false,
        email: false,
      },
    });
    setEditingContactId(null); 
    setCustomRelation("");
    setRelationSearch("");
    setCategorySearch("");
    setJobTypeSearch("");
    setCustomShareOn("");
    setPhoneCount(1);
    setCustomCountryId(null);
    setCustomStateId(null);
    setCustomCityId(null);
    setError("");
    setShowPhonePopup(false);
    setNewPhone("");
    setProfileImageFile(null);
    setAdditionalFiles([]);
    setExistingFiles([]);
    setFirstImageSrc(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleRelationSearch = (e) => {
    const value = e.target.value;
    setRelationSearch(value);
    setShowRelationDropdown(true);
    if (relationOptions.includes(value)) {
      setCustomContact((prev) => ({ ...prev, relation: value }));
      setCustomRelation("");
    } else {
      setCustomContact((prev) => ({ ...prev, relation: "" }));
    }
  };

  const handleRelationSelect = (option) => {
    setCustomContact((prev) => ({ ...prev, relation: option }));
    setRelationSearch(option);
    setCustomRelation("");
    setShowRelationDropdown(false);
  };

  const handleAddCustomRelation = () => {
    if (relationSearch.trim()) {
      setCustomRelation(relationSearch.trim());
      setRelationSearch(relationSearch.trim());
      setCustomContact((prev) => ({ ...prev, relation: "" }));
      setShowRelationDropdown(false);
    }
  };

  const handleRelationKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      relationSearch.trim() &&
      !relationOptions.includes(relationSearch)
    ) {
      handleAddCustomRelation();
    }
  };

  const handleCategorySearch = (e) => {
    setCategorySearch(e.target.value);
    setShowCategoryDropdown(true);
    if (categoryOptions.includes(e.target.value)) {
      setCustomContact((prev) => ({ ...prev, category: e.target.value }));
    } else {
      setCustomContact((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleCategorySelect = (option) => {
    setCustomContact((prev) => ({ ...prev, category: option }));
    setCategorySearch(option);
    setShowCategoryDropdown(false);
  };

  const filteredRelations = relationOptions.filter((option) =>
    option.toLowerCase().includes(relationSearch.toLowerCase())
  );

  const filteredCategories = categoryOptions.filter((option) =>
    option.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = `${contact.first_name || ''} ${contact.last_name || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLetter = selectedLetter
      ? (contact.first_name || '').toLowerCase().startsWith(selectedLetter.toLowerCase())
      : true;
    const matchesCategory =
      filterOptions.categories.length === 0 ||
      filterOptions.categories.some(cat => {
        if (['Family', 'Friends', 'Work'].includes(cat)) {
          return contact.category === cat;
        }
        return contact.category?.toLowerCase().includes(cat.toLowerCase());
      });
    const matchesRelation =
      filterOptions.relations.length === 0 ||
      filterOptions.relations.some(rel => {
        if (relationOptions.includes(rel)) {
          return contact.relation === rel;
        }
        return contact.relation?.toLowerCase().includes(rel.toLowerCase());
      });
    
    const matchesSharedAfterPassAway =
      !filterOptions.sharedAfterPassAway ||
      contact.release_on_pass === true ||
      contact.release_on_pass === 1;
    return matchesSearch && matchesLetter && matchesCategory && matchesRelation && matchesSharedAfterPassAway;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map((contact) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        relationInputRef.current &&
        !relationInputRef.current.contains(event.target)
      ) {
        setShowRelationDropdown(false);
      }
      if (
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        !event.target.closest(".contact-action-dropdown") &&
        !event.target.closest(".contact-action-button") &&
        !event.target.closest(".add-contact-categorize-options") &&
        !event.target.closest(".add-contact-action-dropdown")
      ) {
        setDropdownOpen(null);
      }

      if (
        shareOnInputRef.current &&
        !shareOnInputRef.current.contains(event.target)
      ) {
        setShowShareOnDropdown(false);
      }

    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleShareOnSearch = (e) => {
    const value = e.target.value;
    setCustomShareOn(value);
    setShowShareOnDropdown(true);
    if (shareOnOptions.includes(value)) {
      setCustomContact((prev) => ({ ...prev, share_on: value }));
    } else {
      setCustomContact((prev) => ({ ...prev, share_on: value.trim() }));
    }
  };

  const handleShareOnSelect = (option) => {
    setCustomContact((prev) => ({ ...prev, share_on: option }));
    setCustomShareOn(option);
    setShowShareOnDropdown(false);
  };

  const handleAddCustomShareOn = () => {
    setShowShareOnDropdown(false);
    setCustomShareOn(customShareOn.trim());
    setCustomContact((prev) => ({ ...prev, share_on: customShareOn.trim() }));
    shareOnInputRef.current?.focus();
  };

  const handleShareOnKeyDown = (e) => {
    if (e.key === "Enter" && customShareOn.trim()) {
      setCustomContact((prev) => ({ ...prev, share_on: customShareOn.trim() }));
      setCustomShareOn(customShareOn.trim());
      setShowShareOnDropdown(false);
    }
  };

  const filteredShareOnOptions = shareOnOptions.filter((option) =>
    option.toLowerCase().includes(customShareOn.toLowerCase())
  );

  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        toast.error("Profile image must be a JPEG, PNG, or GIF.", {
          autoClose: 3000,
        });
        return;
      }
      if (file.size > maxFileSize) {
        toast.error("Profile image must be less than 5MB.", { autoClose: 3000 });
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomContact((prev) => ({ ...prev, contact_image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalFilesChange = (event) => {
    const files = Array.from(event.target.files);
    const currentFileCount = additionalFiles.length;
    const maxFiles = 15;

    if (currentFileCount + files.length > maxFiles) {
      toast.error(`You can upload a maximum of ${maxFiles} files.`, {
        autoClose: 3000,
      });
      return;
    }

    const validFiles = files.filter((file) => {
      if (!allowedFileTypes.includes(file.type)) {
        toast.error(
          `File ${file.name} must be a JPEG, PNG, GIF, PDF, DOC, or DOCX.`,
          { autoClose: 3000 }
        );
        return false;
      }
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} must be less than 5MB.`, { autoClose: 3000 });
        return false;
      }
      return true;
    });

    setAdditionalFiles((prev) => [...prev, ...validFiles]);
  };

  const toggleDropdown = (contactId) => {
    setDropdownOpen(dropdownOpen === contactId ? null : contactId);
  };

  const getCategoryDisplay = (contact) => {
    const parts = [];
    if (contact.category) parts.push(contact.category);
    if (contact.relation) parts.push(contact.relation);
    if (contact.is_ambassador) parts.push("Ambassador");
    if (contact.is_nominee) parts.push("Nominee");
    return parts.length > 0 ? parts.join("/") : "N/A";
  };

  const getCategoryClass = (contact) => {
    if (!contact.category) return "category-na";
    if (
      (contact.category === "Family" && contact.relation) ||
      (contact.is_ambassador &&
        ["Family", "Friends", "Work"].includes(contact.category)) ||
      (contact.is_nominee &&
        ["Family", "Friends", "Work"].includes(contact.category))
    ) {
      if (
        (contact.category === "Family" && contact.relation === "Daughter" && contact.is_ambassador) ||
        contact.is_ambassador ||
        contact.is_nominee
      ) {
        return "category-ambassador-nominee";
      }
      if (contact.category === "Family" && contact.relation === "Son") {
        return "category-family-son";
      }
    }
    if (contact.category === "Friends") return "category-friends";
    if (contact.category === "Work") return "category-work";
    return "category-na";
  };

  const getPhoneNumbersDisplay = (contact) => {
    const numbers = [
      contact.phone_number,
      contact.phone_number1,
      contact.phone_number2,
      contact.phone_number3,
    ].filter((num) => num && num.trim());

    if (numbers.length === 0) return "N/A";

    // Option 1: Comma-separated
    //return numbers.join(", ");

    
    return numbers.map((num, index) => (
      <span key={index} className="contact-phone ">
        {num}
        {index < numbers.length - 1 && <br />}
      </span>
    ));
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchContacts(page, filter, searchQuery, filterOptions);
    }
  };

  useEffect(() => {
    debouncedFetchContacts(searchQuery, filterOptions);
    return () => debouncedFetchContacts.cancel();
  }, [searchQuery, filterOptions]);

  const debouncedFetchContacts = debounce((query, filters) => {
    fetchContacts(currentPage, filter, query, filters);
  }, 300);

  const fetchAddressSuggestions = debounce(async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setAddressSuggestions(data.results);
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    } catch (err) {
      setError("Failed to fetch address suggestions: " + err.message);
      toast.error("Failed to fetch address suggestions: " + err.message, { autoClose: 3000 });
    }
  }, 300);

  const handleAddressSelect = (result, isCustom = false) => {
    if (isCustom) {
      setCustomContact((prev) => ({
        ...prev,
        flat_building_no: addressSearch.trim(),
      }));
    } else {
      const components = result.components;
      const formatted = result.formatted;

      
      const addressParts = formatted.split(",").map(part => part.trim());

      
      let flatBuildingNo = "";
      let street = "";
      let city = components.city || components.town || components.village || "";
      let state = components.state || "";
      let postalCode = components.postcode || "";
      let country = components.country || "";

      
      if (addressParts.length > 0) {
        flatBuildingNo = addressParts[0]; 
        if (addressParts.length > 1) {
          street = addressParts.slice(1, addressParts.length - 3).join(", "); 
        }
        if (addressParts.length >= 3) {
          city = city || addressParts[addressParts.length - 3] || "";
          state = state || addressParts[addressParts.length - 2] || "";
          country = country || addressParts[addressParts.length - 1] || "";
        }
      }

      setCustomContact((prev) => ({
        ...prev,
        flat_building_no: flatBuildingNo || components.building || components.road || "",
        street: street || components.suburb || components.neighbourhood || "",
        city,
        state,
        postal_code: postalCode,
        country,
      }));
    }
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressSearch("");
  };

  const handleAddCustomAddress = () => {
    if (addressSearch.trim()) {
      setCustomContact((prev) => ({
        ...prev,
        flat_building_no: addressSearch.trim(),
      }));
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      setAddressSearch(addressSearch.trim()); 
    } else {
      toast.error("Please enter an address.", { autoClose: 3000 });
    }
  };

  const handleAddressKeyDown = (e) => {
    if (e.key === "Enter" && addressSearch.trim()) {
      if (!addressSuggestions.some(s => s.formatted.toLowerCase() === addressSearch.toLowerCase())) {
        handleAddCustomAddress();
      } else {
       
        const matchingSuggestion = addressSuggestions.find(s => s.formatted.toLowerCase() === addressSearch.toLowerCase());
        if (matchingSuggestion) {
          handleAddressSelect(matchingSuggestion);
        }
      }
      e.preventDefault(); 
    }
  };

  const handleLetterSelect = (letter) => {
    setClickedLetter(prev => (prev === letter || letter === '') ? '' : letter);
    setSelectedLetter(letter);
    setCurrentPage(1); 
  };


  const handleLetterHover = (letter) => {
    if (!clickedLetter) {
      setSelectedLetter(letter);
    }
  };

  const handleLetterHoverOut = () => {
    if (!clickedLetter) {
      setSelectedLetter('');
    } else {
      setSelectedLetter(clickedLetter);
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 3;
    const showEllipsisThreshold = maxPagesToShow + 2;


    pageNumbers.push(1);

    let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage === totalPages - 1) {
      startPage = Math.max(2, endPage - maxPagesToShow + 1);
    }

    if (startPage > 2) {
      pageNumbers.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push("...");
    }

    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return (
      <div className="pagination-container">
        {currentPage !== 1 && (
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Go to previous page"
          >
            Previous
          </button>
        )}
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            className={`pagination-button ${currentPage === page ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...'}
            aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        {currentPage !== totalPages && (
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Go to next page"
          >
            Next
          </button>
        )}
      </div>
    );
  };

  const [isViewContactOpen, setIsViewContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setIsViewContactOpen(true);
  };

  const handleCloseViewContact = () => {
    setIsViewContactOpen(false);
    setSelectedContact(null);
  };

  const [jobTypeSearch, setJobTypeSearch] = useState("");
  const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
  const jobTypeInputRef = useRef(null);

  const jobTypeOptions = [
    "Software Engineer – Technology/IT",
    "Marketing Manager – Marketing & Communications",
    "Human Resources Executive – HR & Administration",
    "Financial Analyst – Finance & Accounting",
    "Sales Executive – Sales & Business Development",
    "Graphic Designer – Design & Creative",
    "Operations Manager – Operations & Logistics",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        relationInputRef.current &&
        !relationInputRef.current.contains(event.target)
      ) {
        setShowRelationDropdown(false);
      }
      if (
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        jobTypeInputRef.current &&
        !jobTypeInputRef.current.contains(event.target)
      ) {
        setShowJobTypeDropdown(false);
      }
      if (
        shareOnInputRef.current &&
        !shareOnInputRef.current.contains(event.target)
      ) {
        setShowShareOnDropdown(false);
      }
      if (
        !event.target.closest(".address-suggestions-dropdown") &&
        !event.target.closest(".add-contact-form-input")
      ) {
        setShowAddressSuggestions(false);
        setAddressSearch(customContact.flat_building_no || "");
      }
      if (
        !event.target.closest(".contact-action-dropdown") &&
        !event.target.closest(".contact-action-button") &&
        !event.target.closest(".add-contact-categorize-options") &&
        !event.target.closest(".add-contact-action-dropdown")
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [customContact.flat_building_no]);

  const handleJobTypeSearch = (e) => {
    const value = e.target.value;
    setJobTypeSearch(value);
    setShowJobTypeDropdown(true);
    if (jobTypeOptions.includes(value)) {
      setCustomContact((prev) => ({ ...prev, job_type: value }));
    } else {
      setCustomContact((prev) => ({ ...prev, job_type: "" }));
    }
  };

  const handleJobTypeSelect = (option) => {
    setCustomContact((prev) => ({ ...prev, job_type: option }));
    setJobTypeSearch(option);
    setShowJobTypeDropdown(false);
  };

  const handleAddCustomJobType = () => {
    if (jobTypeSearch.trim()) {
      setCustomContact((prev) => ({ ...prev, job_type: jobTypeSearch.trim() }));
      setJobTypeSearch(jobTypeSearch.trim());
      setShowJobTypeDropdown(false);
      jobTypeInputRef.current?.focus();
    }
  };

  const handleJobTypeKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      jobTypeSearch.trim() &&
      !jobTypeOptions.includes(jobTypeSearch)
    ) {
      handleAddCustomJobType();
    }
  };

  const filteredJobTypes = jobTypeOptions.filter((option) =>
    option.toLowerCase().includes(jobTypeSearch.toLowerCase())
  );

  const isFilterActive = filterOptions.categories.length > 0 ||
    filterOptions.relations.length > 0 ||
    filterOptions.sharedAfterPassAway ||
    selectedLetter !== '';

  return (
    <div className="add-contact-page">
      <h2 className="add-contact-title">Contacts</h2>
      {contacts.length === 0 && !searchQuery && !isFilterActive ? (
        <div className="add-contact-empty-box">
          <img
            src={folderIcon}
            alt="Folder Icon"
            className="add-contact-folder-icon"
          />
          <h4 className="add-contact-empty-heading">This folder is empty</h4>
          <p className="add-contact-empty-subtext">
            Add your contact through Google, phone, or customize your own.
          </p>
          <button className="add-contact-add-button" onClick={toggleDrawer}>
            + Add Contacts
          </button>
        </div>
      ) : (
        <>
          <div className="contact-header">
            <div className="contact-header-actions">
              <div className="contact-header-search-filter">
                <div className="contact-search-bar">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="contact-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="contact-search-button">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.435 11.068L14.95 14.483"
                        stroke="#4C5767"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="6.783"
                        cy="6.783"
                        r="5.283"
                        stroke="#4C5767"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>
                <FilterDropdown filterOptions={filterOptions} setFilterOptions={setFilterOptions} />
              </div>
              <div className="contact-header-buttons">
                <button className="contact-header-button" onClick={handleDeleteSelected}>
                  <img src={deleteIcon} alt="Delete Icon" className="contact-header-icon" />
                  Bulk Delete <span className="dropdown-icon"></span>
                </button>
                <CategorizeDropdown
                  selectedContacts={selectedContacts}
                  contacts={contacts}
                  setSelectedContacts={setSelectedContacts}
                  fetchContacts={fetchContacts}
                  categoryDropdownRef={categoryDropdownRef}
                  relationDropdownRef={relationDropdownRef}
                  roleDropdownRef={roleDropdownRef}
                  categoryOptions={categoryOptions}
                  relationOptions={relationOptions}
                  fetchedCategories={filterOptions.fetchedCategories}
                  fetchedRelations={filterOptions.fetchedRelations}
                />
                <button className="contact-add-button" onClick={toggleDrawer}>
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div className="contact-table-container">
            <div className="contact-alphabet-filter">
              <div
                className={`alphabet-option ${selectedLetter === '' ? 'active' : ''}`}
                onClick={() => handleLetterSelect('')}
                onMouseEnter={() => handleLetterHover('')}
                onMouseLeave={() => handleLetterHoverOut('')}
              >
                #
              </div>
              {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
                <div
                  key={letter}
                  className={`alphabet-option ${selectedLetter === letter ? 'active' : ''}`}
                  onClick={() => handleLetterSelect(letter)}
                  onMouseEnter={() => handleLetterHover(letter)}
                  onMouseLeave={() => handleLetterHoverOut(letter)}
                >
                  {letter}
                </div>
              ))}
            </div>

            <table className="contact-table">
              <thead>
                <tr className="main-tbl">
                  <th className="border_tl-round">
                    <input
                      type="checkbox"
                      className="contact-table-checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedContacts.length === filteredContacts.length &&
                        filteredContacts.length > 0
                      }
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th className="border_tr-round">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="contact-item">
                    <td>
                      <input
                        type="checkbox"
                        className="contact-table-checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                      />
                    </td>
                    <td>
                      <div className="contact-item-image">
                        {contact.contact_image ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${contact.contact_image}`}
                            alt="Profile"
                            className="contact-item-image-img"
                          />
                        ) : (
                          <div className="contact-item-image-placeholder">
                            {contact.first_name && contact.first_name.charAt(0)}
                            {contact.last_name && contact.last_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="contact-item-name">
                        {`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                      </span>
                    </td>
                    <td>{contact.email || ""}</td>
                    <td className="contact-phone">
                      {getPhoneNumbersDisplay(contact)}
                    </td>
                    <td>
                      <span className={`contact-category ${getCategoryClass(contact)}`}>
                        {getCategoryDisplay(contact)}
                      </span>
                    </td>
                    <td>
                      <div className="contact-action-container">
                        <button
                          className="contact-action-button"
                          onClick={() => toggleDropdown(contact.id)}
                        >
                          ⋮
                        </button>
                        {dropdownOpen === contact.id && (
                          <div className="contact-action-dropdown">
                            <button
                              className="contact-action-option"
                              onClick={() => handleViewContact(contact)}
                            >
                              View
                            </button>
                            {isViewContactOpen && selectedContact && (
                              <ViewContact
                                contact={selectedContact}
                                onClose={handleCloseViewContact}
                                onEdit={handleEditContact}
                                onDelete={handleDeleteContact}
                              />
                            )}
                            <button
                              className="contact-action-option"
                              onClick={() => handleEditContact(contact)}
                            >
                              Edit
                            </button>
                            <button
                              className="contact-action-option delete"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              Delete
                            </button>

                            {showDeleteConfirm && (
                              <div className="delete-confirm-popup-backdrop">
                                <div className="delete-confirm-popup">
                                  <button
                                    className="delete-confirm-close"
                                    onClick={() => {
                                      setShowDeleteConfirm(false);
                                      setContactIdToDelete(null);
                                    }}
                                  >
                                    ×
                                  </button>
                                  <h3 className="delete-confirm-heading">Confirm Deletion</h3>
                                  <p className="delete-confirm-message">
                                    Are you sure you want to delete this contact? This action cannot be undone.
                                  </p>
                                  <div className="delete-confirm-actions">
                                    <button
                                      className="add-contact-form-button cancel"
                                      onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setContactIdToDelete(null);
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="add-contact-form-button delete"
                                      onClick={confirmDeleteContact}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!searchQuery && totalPages > 1 && renderPagination()}
        </>
      )}

      <div className={`add-contact-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="add-contact-drawer-top">
          <button className="add-contact-drawer-close" onClick={toggleDrawer}>
            ×
          </button>
        </div>
        <div className="add-contact-drawer-divider" />
        <h3 className="add-contact-drawer-heading">
          Add People to Contact Lists
        </h3>

        <div className="add-contact-drawer-options">
          <div className="add-contact-drawer-option" onClick={syncPhoneDirectly}>
            <div className="add-contact-drawer-icon-circle">
              <img src={PhoneIcon} alt="Phone Icon" />
            </div>
            <span className="add-contact-drawer-option-label">
              Sync on Mobile
            </span>
          </div>

          <div className="add-contact-drawer-option" onClick={syncWithGoogle}>
            <div className="add-contact-drawer-icon-circle">
              <img src={GoogleIcon} alt="Google Icon" />
            </div>
            <span className="add-contact-drawer-option-label">
              Sync on Google Contact
            </span>
          </div>

          <div
            className="add-contact-drawer-option"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="add-contact-drawer-icon-circle">
              <img src={VFCIcon} alt="VCF Icon" />
            </div>
            <span className="add-contact-drawer-option-label">
              Upload VCF File
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vcf, text/vcard"
              onChange={syncPhoneViaVcf}
              style={{ display: "none" }}
            />
          </div>

          <div
            className="add-contact-drawer-option"
            onClick={() => setShowCustomForm(true)}
          >
            <div className="add-contact-drawer-icon-circle">
              <img src={CustomIcon} alt="Custom Icon" />
            </div>
            <span className="add-contact-drawer-option-label">
              Add Custom Contact
            </span>
          </div>
        </div>
      </div>

      {isDrawerOpen && (
        <div className="add-contact-drawer-backdrop" onClick={toggleDrawer}></div>
      )}

      {showCustomForm && (
        <div className="add-contact-modal-backdrop">
          <div className="add-contact-modal add-contact-custom-form">
            <button className="add-contact-modal-close" onClick={closeCustomForm}>
              ×
            </button>
            <div className="add-contact-modal-header">
              <h2 className="add-contact-custom-heading">
                {editingContactId ? "Edit Contact" : "Add Custom Contact"}
              </h2>
              <div className="add-contact-profile-image-container">
                <div
                  className="add-contact-profile-image"
                  onClick={() => imageInputRef.current?.click()}
                >
                  {customContact.contact_image ? (
                    <img
                      src={customContact.contact_image}
                      alt="Profile"
                      className="add-contact-profile-image-img"
                    />
                  ) : (
                    <div className="add-contact-profile-image-placeholder" />
                  )}
                </div>
                <img
                  src={cameraIcon}
                  alt="Camera Icon"
                  className="add-contact-camera-icon"
                  onClick={() => imageInputRef.current?.click()}
                />
                <label className="add-contact-checkbox-label add-contact-release-checkbox">
                  <input
                    type="checkbox"
                    checked={customContact.release_on_pass}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        release_on_pass: e.target.checked,
                      }))
                    }
                  />
                  Information is released when one passes away
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="add-contact-form-content">
              <div className="add-contact-form-row">
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">First Name</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.first_name}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Middle Name</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.middle_name}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        middle_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Last Name</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.last_name}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Company</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.company}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                  />
                </div>
                <div
                  className="add-contact-form-group job-type-group"
                  ref={jobTypeInputRef}
                >
                  <label className="add-contact-form-label">Job Type</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={jobTypeSearch}
                    onChange={handleJobTypeSearch}
                    onFocus={() => setShowJobTypeDropdown(true)}
                    onKeyDown={handleJobTypeKeyDown}
                    placeholder="Search or enter job type"
                  />
                  {showJobTypeDropdown && (
                    <div className="job-type-dropdown">
                      {filteredJobTypes.length > 0 || jobTypeSearch.trim() ? (
                        <>
                          {filteredJobTypes.map((option) => (
                            <div
                              key={option}
                              className="job-type-option"
                              onClick={() => handleJobTypeSelect(option)}
                            >
                              {option}
                            </div>
                          ))}
                          <div
                            className="relation-option add-custom"
                            onClick={() => {
                              setShowJobTypeDropdown(false);
                              setJobTypeSearch(jobTypeSearch.trim());
                              setCustomContact((prev) => ({ ...prev, job_type: jobTypeSearch.trim() }));
                              jobTypeInputRef.current?.focus();
                            }}
                          >
                            Add Custom{jobTypeSearch && ":"} {jobTypeSearch}
                          </div>
                        </>
                      ) : (
                        <div className="job-type-option no-results">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Website</label>
                  <input
                    type="url"
                    className="add-contact-form-input"
                    value={customContact.website}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="add-contact-form-row">
                <div
                  className="add-contact-form-group category-group"
                  ref={categoryInputRef}
                >
                  <label className="add-contact-form-label">Category</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={categorySearch}
                    onChange={handleCategorySearch}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Search or enter category"
                  />
                  {showCategoryDropdown && (
                    <div className="category-dropdown">
                      {filteredCategories.length > 0 || categorySearch.trim() ? (
                        <>
                          {filteredCategories.map((option) => (
                            <div
                              key={option}
                              className="category-option"
                              onClick={() => handleCategorySelect(option)}
                            >
                              {option}
                            </div>
                          ))}
                          <div
                            className="relation-option add-custom"
                            onClick={() => {
                              setShowCategoryDropdown(false);
                              setCategorySearch(categorySearch.trim());
                              setCustomContact((prev) => ({ ...prev, category: categorySearch.trim() }));
                            }}
                          >
                            Add Custom{categorySearch && ":"} {categorySearch}
                          </div>
                        </>
                      ) : (
                        <div className="category-option no-results">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className="add-contact-form-group relation-group"
                  ref={relationInputRef}
                >
                  <label className="add-contact-form-label">Relation</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={relationSearch}
                    onChange={handleRelationSearch}
                    onFocus={() => setShowRelationDropdown(true)}
                    onKeyDown={handleRelationKeyDown}
                    placeholder="Search or enter relation"
                  />
                  {showRelationDropdown && (
                    <div className="relation-dropdown">
                      {filteredRelations.length > 0 || relationSearch.trim() ? (
                        <>
                          {filteredRelations.map((option) => (
                            <div
                              key={option}
                              className="relation-option"
                              onClick={() => handleRelationSelect(option)}
                            >
                              {option}
                            </div>
                          ))}
                          <div
                            className="relation-option add-custom"
                            onClick={() => {
                              setShowRelationDropdown(false);
                              setCustomRelation(relationSearch.trim());
                              setRelationSearch(relationSearch.trim());
                              setCustomContact((prev) => ({ ...prev, relation: relationSearch.trim() }));
                            }}
                          >
                            Add Custom{relationSearch && ":"} {relationSearch}
                          </div>
                        </>
                      ) : (
                        <div className="relation-option no-results">
                          No results found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="add-contact-form-group phone-group">
                  <label className="add-contact-form-label">
                    Phone Number{" "}
                    <span
                      className="add-phone-icon"
                      onClick={() => setShowPhonePopup(true)}
                    >
                      +
                    </span>
                  </label>
                  <div className="phone-input-row">
                    <PhoneInput
                      country={"in"}
                      value={customContact.phone_number}
                      onChange={(phone) =>
                        setCustomContact((prev) => ({
                          ...prev,
                          phone_number: phone.startsWith("+") ? phone : `+${phone}`,
                        }))
                      }
                      inputClass="add-contact-form-input"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="added-contacts-row">
                    {customContact.phone_number1 && (
                      <span className="added-contact">
                        {customContact.phone_number1}
                        <button
                          className="remove-contact-btn"
                          onClick={() =>
                            removePhoneNumber(customContact.phone_number1)
                          }
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {customContact.phone_number2 && (
                      <span className="added-contact">
                        {customContact.phone_number2}
                        <button
                          className="remove-contact-btn"
                          onClick={() =>
                            removePhoneNumber(customContact.phone_number2)
                          }
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {customContact.phone_number3 && (
                      <span className="added-contact">
                        {customContact.phone_number3}
                        <button
                          className="remove-contact-btn"
                          onClick={() =>
                            removePhoneNumber(customContact.phone_number3)
                          }
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Email</label>
                  <input
                    type="email"
                    className="add-contact-form-input"
                    value={customContact.email}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group" style={{ position: "relative" }}>
                  <label className="add-contact-form-label">Flat/Building No</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={addressSearch}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setAddressSearch(newValue);
                      setCustomContact((prev) => ({
                        ...prev,
                        flat_building_no: newValue,
                      }));
                      fetchAddressSuggestions(newValue);
                    }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    onKeyDown={handleAddressKeyDown}
                    placeholder="Enter or search address"
                  />
                  {showAddressSuggestions && (addressSuggestions.length > 0 || addressSearch.trim()) && (
                    <div className="address-suggestions-dropdown">
                      {addressSuggestions.map((result, index) => (
                        <div
                          key={index}
                          className="address-suggestion-item"
                          onClick={() => handleAddressSelect(result)}
                        >
                          {result.formatted}
                        </div>
                      ))}
                      {addressSearch.trim() && !addressSuggestions.some(s => s.formatted.toLowerCase() === addressSearch.toLowerCase()) && (
                        <div
                          className="address-suggestion-item add-custom"
                          onClick={handleAddCustomAddress}
                        >
                          Add Custom{addressSearch && ": "} {addressSearch}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Street</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.street}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Country</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.country}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">State</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.state}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">City</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.city}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Postal Code</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.postal_code}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="add-contact-form-input"
                    value={customContact.date_of_birth}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        date_of_birth: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Anniversary</label>
                  <input
                    type="date"
                    className="add-contact-form-input"
                    value={customContact.anniversary}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        anniversary: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group full-width">
                  <label className="add-contact-form-label">Notes</label>
                  <textarea
                    className="add-contact-form-input"
                    value={customContact.notes}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows="3"
                  />

                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group share-on-group" ref={shareOnInputRef}>
                  <label className="add-contact-form-label">Share On</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customShareOn}
                    onChange={handleShareOnSearch}
                    onFocus={() => setShowShareOnDropdown(true)}
                    onKeyDown={handleShareOnKeyDown}
                    placeholder="Select or enter share on days"
                  />
                  {showShareOnDropdown && (
                    <div className="add-contact-share-on-dropdown">
                      <>
                        {filteredShareOnOptions.map((option) => (
                          <div
                            key={option}
                            className="add-contact-share-on-option"
                            onClick={() => handleShareOnSelect(option)}
                          >
                            {option}
                          </div>
                        ))}
                        <div
                          className="add-contact-share-on-option add-custom"
                          onClick={handleAddCustomShareOn}
                        >
                          Add Custom{customShareOn.trim() && `: ${customShareOn}`}
                        </div>
                      </>
                    </div>
                  )}
                </div>
                <div className="add-contact-form-group share-by-group">
                  <label className="add-contact-form-label">Share By</label>
                  <div className="add-contact-share-by-checkboxes">
                    <label className="add-contact-checkbox-label">
                      <input
                        type="checkbox"
                        checked={customContact.share_by.whatsapp}
                        onChange={(e) =>
                          setCustomContact((prev) => ({
                            ...prev,
                            share_by: { ...prev.share_by, whatsapp: e.target.checked },
                          }))
                        }
                      />
                      WhatsApp
                    </label>
                    <label className="add-contact-checkbox-label">
                      <input
                        type="checkbox"
                        checked={customContact.share_by.sms}
                        onChange={(e) =>
                          setCustomContact((prev) => ({
                            ...prev,
                            share_by: { ...prev.share_by, sms: e.target.checked },
                          }))
                        }
                      />
                      SMS
                    </label>
                    <label className="add-contact-checkbox-label">
                      <input
                        type="checkbox"
                        checked={customContact.share_by.email}
                        onChange={(e) =>
                          setCustomContact((prev) => ({
                            ...prev,
                            share_by: { ...prev.share_by, email: e.target.checked },
                          }))
                        }
                      />
                      Email
                    </label>
                  </div>
                </div>
              </div>

              <div className="add-contact-form-row">
                <div className="add-contact-form-group full-width">
                  <label className="add-contact-form-label">Upload Additional Files</label>
                  <div className="add-contact-file-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleAdditionalFilesChange}
                      style={{ display: "none" }}
                    />
                    <div className="add-contact-file-dropzone-container">
                      {(additionalFiles.some((file) => allowedImageTypes.includes(file.type)) ||
                        existingFiles.some((file) => {
                          const ext = file.file_name.split('.').pop().toLowerCase();
                          return allowedImageTypes.includes(extensionToMimeType[ext] || "");
                        })) ? (
                        <div className="add-contact-file-preview">
                          {existingFiles
                            .filter((file) => {
                              const ext = file.file_name.split('.').pop().toLowerCase();
                              return allowedImageTypes.includes(extensionToMimeType[ext] || "");
                            })
                            .map((file) => (
                              <div key={file.id} className="add-contact-file-preview-item">
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${file.file_path}`}
                                  alt={file.file_name}
                                  className="add-contact-file-preview-img"
                                  onError={(e) => {
                                    e.target.src = uploadFileIcon;
                                    console.error(`Failed to load image: ${file.file_path}`);
                                  }}
                                />
                                <button
                                  className="add-contact-file-remove-btn"
                                  onClick={() => handleDeleteFile(file.id, editingContactId)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          {additionalFiles
                            .filter((file) => allowedImageTypes.includes(file.type))
                            .map((file, index) => (
                              <div key={`new-${index}`} className="add-contact-file-preview-item">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="add-contact-file-preview-img"
                                />
                                <button
                                  className="add-contact-file-remove-btn"
                                  onClick={() =>
                                    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index))
                                  }
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          <button
                            className="add-contact-file-add-more"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div
                          className="add-contact-file-dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <img
                            src={uploadFileIcon}
                            alt="Upload Icon"
                            className="add-contact-file-upload-icon"
                          />
                          <p className="add-contact-upload-desc">Drag and drop files here</p>
                          <p className="add-contact-or">or</p>
                          <p className="add-contact-upload-browse">Browse files</p>
                        </div>
                      )}
                    </div>

                    {(additionalFiles.length > 0 || existingFiles.length > 0) && (
                      <div className="added-files">
                        {existingFiles.map((file) => (
                          <div key={file.id} className="added-file">
                            <span>{file.file_name}</span>
                            <button
                              className="remove-file-btn"
                              onClick={() => handleDeleteFile(file.id, editingContactId)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {additionalFiles.map((file, index) => (
                          <div key={`new-${index}`} className="added-file">
                            <span>{file.name}</span>
                            <button
                              className="remove-file-btn"
                              onClick={() =>
                                setAdditionalFiles(additionalFiles.filter((_, i) => i !== index))
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="add-contact-form-actions">
                <button
                  className="add-contact-form-button cancel"
                  onClick={closeCustomForm}
                >
                  Cancel
                </button>
                <button
                  className="add-contact-form-button save"
                  onClick={handleAddOrUpdateContact}
                >
                  {editingContactId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPhonePopup && (
        <div className="phone-popup-backdrop">
          <div className="phone-number">
            <button
              className="phone-popup-close"
              onClick={() => setShowPhonePopup(false)}
            >
              ×
            </button>
            <label className="add-contact-form-label">Add Phone Number</label>
            <PhoneInput
              country={"in"}
              value={newPhone}
              onChange={(phone) =>
                setNewPhone(phone.startsWith("+") ? phone : `+${phone}`)
              }
              inputClass="add-contact-form-input"
              placeholder="Phone Number"
            />
            <div className="phone-popup-actions">
              <button
                className="add-contact-form-button cancel"
                onClick={() => setShowPhonePopup(false)}
              >
                Cancel
              </button>
              <button
                className="add-contact-form-button save"
                onClick={handleAddPhoneNumber}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="add-contact-error">{error}</p>}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default Contact;


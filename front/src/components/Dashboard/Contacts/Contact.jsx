import React, { useState, useEffect, useRef } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import axios from "axios";
import vCard from "vcf";
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

const OPENCAGE_API_KEY = "4cd0370d3cee487181c2d52e3fc22370";

// New CategorizeDropdown Component
const CategorizeDropdown = ({
  selectedContacts,
  contacts,
  setSelectedContacts,
  fetchContacts,
  categoryDropdownRef,
  relationDropdownRef,
  roleDropdownRef,
}) => {
  const [categorizeData, setCategorizeData] = useState({
    category: "",
    relation: "",
    isAmbassador: false,
    isNominee: false,
  });
  const [customRelation, setCustomRelation] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const categoryOptions = ["Family", "Friends", "Work"];
  const relationOptions = [
    "Son",
    "Daughter",
    "Wife",
    "Husband",
    "Father",
    "Mother",
    "Brother",
    "Sister",
    "Custom",
  ];

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

    const finalRelation = relation === "Custom" ? customRelation : relation;

    if (relation === "Custom" && !finalRelation) {
      toast.error("Please enter a custom relation.", { autoClose: 3000 });
      return;
    }

    try {
      const contactIds = selectedContacts;

      const response = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/contacts/categorize-contacts`, // Added /contacts
  {
    contactIds,
    category,
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
        setCustomRelation("");
        setShowCategoryDropdown(false);
        setShowRelationDropdown(false);
        setShowRoleDropdown(false);
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
    setCategorizeData((prev) => ({
      ...prev,
      category,
      relation: "",
      isAmbassador: false,
      isNominee: false,
    }));
    setCustomRelation("");
    setShowCategoryDropdown(true);
    setShowRelationDropdown(category === "Family");
    setShowRoleDropdown(
      category === "Family" || category === "Friends" || category === "Work"
    );
  };

  const handleRelationSelect = (relation) => {
    setCategorizeData((prev) => ({
      ...prev,
      relation: prev.category === "Family" ? relation : "",
      isAmbassador: false,
      isNominee: false,
    }));
    setShowRelationDropdown(true);
    setShowRoleDropdown(false);
    if (relation !== "Custom") {
      setCustomRelation("");
      setShowRoleDropdown(true);
    }
  };

  const handleRoleChange = (role) => {
    if (role === "none") {
      setCategorizeData((prev) => ({
        ...prev,
        isAmbassador: false,
        isNominee: false,
      }));
      handleCategorize(
        categorizeData.category || "Other",
        categorizeData.category === "Family" &&
          categorizeData.relation === "Custom"
          ? customRelation
          : categorizeData.category === "Family"
          ? categorizeData.relation
          : "",
        false,
        false
      );
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
    const { category, relation, isAmbassador, isNominee } = categorizeData;
    handleCategorize(
      category,
      relation === "Custom" ? customRelation : relation,
      isAmbassador,
      isNominee
    );
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
              {categorizeData.category === option && option !== "Family" && (
                <span className="add-contact-checkmark">✔</span>
              )}
            </div>
          ))}
        </div>
      )}
      {showRelationDropdown && categorizeData.category === "Family" && (
        <div
          className="add-contact-categorize-options add-contact-sub-options"
          ref={relationDropdownRef}
        >
          {relationOptions.map((option) => (
            <div
              key={option}
              className={`add-contact-categorize-option ${
                categorizeData.relation === option ? "selected" : ""
              }`}
              onClick={() => handleRelationSelect(option)}
            >
              {option}
              {categorizeData.relation === option && (
                <span className="add-contact-checkmark">✔</span>
              )}
            </div>
          ))}
          {categorizeData.relation === "Custom" && (
            <div className="add-contact-custom-relation-container">
              <div className="add-contact-form-group">
                <input
                  type="text"
                  className="add-contact-form-input"
                  placeholder="Enter custom relation"
                  value={customRelation}
                  onChange={(e) => setCustomRelation(e.target.value)}
                />
              </div>
              <div
                className={`add-contact-categorize-option add-contact-confirm-custom ${
                  !customRelation ? "disabled" : ""
                }`}
                onClick={() => {
                  if (customRelation) {
                    setShowRoleDropdown(true);
                  } else {
                    toast.error("Please enter a custom relation.", {
                      autoClose: 3000,
                    });
                  }
                }}
              >
                Confirm
              </div>
            </div>
          )}
        </div>
      )}
      {showRoleDropdown &&
        (categorizeData.category === "Family" ||
          categorizeData.category === "Friends" ||
          categorizeData.category === "Work") &&
        (categorizeData.category !== "Family" ||
          categorizeData.relation ||
          customRelation) && (
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
  });
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
  const [firstImageSrc, setFirstImageSrc] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const relationInputRef = useRef(null);
  const categoryInputRef = useRef(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const categoryDropdownRef = useRef(null);
  const relationDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);

  const categoryOptions = ["Family", "Friends", "Work"];
  const relationOptions = [
    "Son",
    "Daughter",
    "Wife",
    "Husband",
    "Father",
    "Mother",
    "Brother",
    "Sister",
  ];
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

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/contacts`,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setContacts(response.data.contacts || []);
      } else {
        toast.error(response.data.message, { autoClose: 3000 });
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Failed to fetch contacts", { autoClose: 3000 });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchLocationData = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?key=${OPENCAGE_API_KEY}&q=${latitude}+${longitude}&pretty=1`
      );
      const { results } = response.data;
      if (results && results.length > 0) {
        const location = results[0].components;
        let flatBuildingNo = location.house_number || "";
        let street = location.road || "";

        if (street && street.toLowerCase() === "unnamed road") {
          street = location.neighbourhood || "";
        } else if (!street) {
          street = location.neighbourhood || "";
        }

        setCustomContact((prev) => ({
          ...prev,
          flat_building_no: flatBuildingNo,
          street,
          country: location.country || "",
          state: location.state || "",
          city: location.city || location.town || location.village || "",
          postal_code: location.postcode || "",
        }));

        if (!flatBuildingNo || !street) {
          toast.warn(
            "Building number or street name not available from location data. Please adjust manually if needed.",
            { autoClose: 5000 }
          );
        }
      } else {
        toast.error("Unable to fetch location data.", { autoClose: 3000 });
      }
    } catch (err) {
      setError("Failed to fetch location data: " + err.message);
      toast.error("Failed to fetch location data: " + err.message, {
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (showCustomForm && !editingContactId && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocationData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setError("Geolocation permission denied or unavailable: " + error.message);
          toast.error(
            "Geolocation permission denied or unavailable: " + error.message,
            {
              autoClose: 3000,
            }
          );
        }
      );
    }
  }, [showCustomForm, editingContactId]);

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
                    `Phone number ${number} for ${
                      contact.names?.[0]?.displayName || "Unknown"
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

    try {
      const tempContact = {
        first_name: "Temp VCF Contact",
        phone_number: "+91TEMP",
        email: "temp@vcf.com",
      };
      const saveResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/save`,
        { contacts: [tempContact], source: "vcf" },
        { withCredentials: true }
      );

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.message);
      }

      const contactId = saveResponse.data.contacts?.[0]?.id;
      if (!contactId) {
        throw new Error("Failed to retrieve contact ID for VCF upload.");
      }

      const formData = new FormData();
      formData.append("contactId", contactId);
      for (const file of files) {
        formData.append("files", file);
      }

      const uploadResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contacts/upload`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (uploadResponse.data.success) {
        toast.success(uploadResponse.data.message, { autoClose: 3000 });
        const file = files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const vcfText = e.target.result;
            let phoneContactsData = [];
            const vcfCards = vcfText.split("BEGIN:VCARD").slice(1);

            if (vcfCards.length === 0) {
              throw new Error("No valid vCard entries found in the VCF file.");
            }

            for (const cardText of vcfCards) {
              const fullCard = `BEGIN:VCARD${cardText}`;
              try {
                const parsed = new vCard().parse(fullCard);
                const name = parsed.get("fn")?.valueOf() || "";
                let phoneNumbers = parsed.get("tel")
                  ? Array.isArray(parsed.get("tel"))
                    ? parsed.get("tel").map((tel) => tel.valueOf())
                    : [parsed.get("tel").valueOf()]
                  : [];
                const email = parsed.get("email")?.valueOf() || "";
                const addressComponents = parsed.get("adr")?.valueOf().split(";") || [];
                const org = parsed.get("org")?.valueOf() || "";
                const website = parsed.get("url")?.valueOf() || "";

                phoneNumbers = phoneNumbers
                  .filter((tel) => tel && typeof tel === "string" && tel.trim() !== "")
                  .map((tel) => {
                    let number = tel.replace(/[\s-()]/g, "");
                    const parsedNumber = parsePhoneNumberFromString(number, "IN");
                    if (parsedNumber && parsedNumber.isValid()) {
                      return parsedNumber.formatInternational();
                    }
                    return number.startsWith("+") ? number : `+91${number}`;
                  });

                if (phoneNumbers.length > 0) {
                  const nameParts = name.split(" ");
                  phoneContactsData.push({
                    first_name: nameParts[0] || "Unknown",
                    middle_name:
                      nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "",
                    last_name:
                      nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
                    company: org,
                    job_type: "",
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
                    date_of_birth: "",
                    anniversary: "",
                    notes: "",
                    contact_image: "",
                    release_on_pass: false,
                    is_ambassador: false,
                    is_nominee: false,
                  });
                }
              } catch {
                continue;
              }
            }

            if (phoneContactsData.length > 0) {
              const vcfSaveResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/contacts/save`,
                { contacts: phoneContactsData, source: "vcf" },
                { withCredentials: true }
              );

              if (vcfSaveResponse.data.success) {
                toast.success(vcfSaveResponse.data.message, { autoClose: 3000 });
                if (vcfSaveResponse.data.skipped?.length > 0) {
                  vcfSaveResponse.data.skipped.forEach((skipped) => {
                    toast.error(skipped.reason, { autoClose: 3000 });
                  });
                }
                await fetchContacts();
              } else {
                toast.error(vcfSaveResponse.data.message, { autoClose: 3000 });
              }
            }
          } catch (err) {
            setError("Failed to parse VCF file: " + err.message);
            toast.error("Failed to parse VCF file: " + err.message, {
              autoClose: 3000,
            });
          }
        };
        reader.onerror = () => {
          setError("Failed to read the VCF file.");
          toast.error("Failed to read the VCF file.", { autoClose: 3000 });
        };
        reader.readAsText(file);
      } else {
        toast.error(uploadResponse.data.message, { autoClose: 3000 });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to sync VCF contacts: " + err.message);
      toast.error("Failed to sync VCF contacts: " + err.message, {
        autoClose: 3000,
      });
    }
  };

  const validateContact = (contact) => {
    if (!contact.first_name?.trim()) {
      return "First name is required.";
    }
    if (!contact.phone_number?.trim()) {
      return "At least one phone number is required.";
    }
    const parsedNumber = parsePhoneNumberFromString(contact.phone_number, "IN");
    if (!parsedNumber || !parsedNumber.isValid()) {
      return "Phone number must be in a valid international format (e.g., +91XXXXXXXXXX).";
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

  const handleDeleteContact = async (contactId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/contacts/${contactId}`,
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 3000 });
        setContacts(contacts.filter((contact) => contact.id !== contactId));
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
        `${import.meta.env.VITE_API_URL}/api/delete-contacts`,
        { contactIds: selectedContacts },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message, { autoClose: 3000 });
        await fetchContacts();
        setSelectedContacts([]);
      } else {
        toast.error(response.data.message, { autoClose: 3000 });
      }
    } catch (err) {
      toast.error("Failed to delete selected contacts: " + err.message, {
        autoClose: 3000,
      });
    }
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact.id);
    setCustomContact({
      ...contact,
      contact_image: contact.contact_image
        ? `${import.meta.env.VITE_API_URL}${contact.contact_image}`
        : "",
    });
    setProfileImageFile(null);
    setRelationSearch(contact.relation || "");
    setCategorySearch(contact.category || "");
    setCustomRelation(contact.relation || "");
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
    });
    setCustomRelation("");
    setRelationSearch("");
    setCategorySearch("");
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

  const filteredContacts = contacts.filter((contact) =>
    `${contact.first_name || ""} ${contact.last_name || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(filteredContacts.map((contact) => contact.id));
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  //Option 2: Line breaks (uncomment to use instead of comma-separated)
  return numbers.map((num, index) => (
    <span key={index} className="contact-phone ">
      {num}
      {index < numbers.length - 1 && <br />}
    </span>
  ));
};

  return (
    <div className="add-contact-page">
      <h2 className="add-contact-title">Contacts</h2>
      {contacts.length === 0 ? (
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
               
              </div>
              <div className="contact-header-buttons">
                <button
                  className="contact-header-button"
                  onClick={handleDeleteSelected}
                >
                  Bulk Delete <span className="dropdown-icon">⏷</span>
                </button>
                <CategorizeDropdown
                  selectedContacts={selectedContacts}
                  contacts={contacts}
                  setSelectedContacts={setSelectedContacts}
                  fetchContacts={fetchContacts}
                  categoryDropdownRef={categoryDropdownRef}
                  relationDropdownRef={relationDropdownRef}
                  roleDropdownRef={roleDropdownRef}
                />
                <button className="contact-add-button" onClick={toggleDrawer}>
                  + Add
                </button>
              </div>
            </div>
          </div>

          <table className="contact-table">
            <thead>
              <tr>
                <th>
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
                <th>Action</th>
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
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Job Type</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.job_type}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        job_type: e.target.value,
                      }))
                    }
                  />
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
                    placeholder="Search category"
                  />
                  {showCategoryDropdown && (
                    <div className="category-dropdown">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((option) => (
                          <div
                            key={option}
                            className="category-option"
                            onClick={() => handleCategorySelect(option)}
                          >
                            {option}
                          </div>
                        ))
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
                      {filteredRelations.length > 0 ? (
                        filteredRelations.map((option) => (
                          <div
                            key={option}
                            className="relation-option"
                            onClick={() => handleRelationSelect(option)}
                          >
                            {option}
                          </div>
                        ))
                      ) : (
                        <div
                          className="relation-option add-custom"
                          onClick={handleAddCustomRelation}
                        >
                          Add Custom: "{relationSearch}"
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
                <div className="add-contact-form-group">
                  <label className="add-contact-form-label">Flat/Building No</label>
                  <input
                    type="text"
                    className="add-contact-form-input"
                    value={customContact.flat_building_no}
                    onChange={(e) =>
                      setCustomContact((prev) => ({
                        ...prev,
                        flat_building_no: e.target.value,
                      }))
                    }
                  />
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
                  <label className="add-contact-checkbox-label">
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
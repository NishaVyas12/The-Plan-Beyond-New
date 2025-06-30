import "./Profile.css";
import userImg from "../../assets/images/Profile/image.svg";
import Camera from "../../assets/images/Profile/Camera.svg";
import check from "../../assets/images/Profile/check.svg";
import cross from "../../assets/images/Profile/cross.svg";
import fingerprint from "../../assets/images/Profile/fingerprint.svg";
import { apiService } from "../../services/apiService";
import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { startRegistration } from "@simplewebauthn/browser";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
    profile_image: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDeleteFingerprintConfirm, setShowDeleteFingerprintConfirm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [authOptions, setAuthOptions] = useState({
    authenticatorApp: true,
    emailAuth: false,
    smsNotifications: true,
  });
  const [isFingerprintRegistered, setIsFingerprintRegistered] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [nomineeCount, setNomineeCount] = useState(0);
  const [ambassadorCount, setAmbassadorCount] = useState(0);

  // Fetch profile data, userId, nominees, and ambassadors
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [sessionData, profileData, nomineesData, ambassadorsData] = await Promise.all([
        apiService.get(`${import.meta.env.VITE_API_URL}/api/check-session`),
        apiService.get(`${import.meta.env.VITE_API_URL}/api/get-profile`),
        apiService.get(`${import.meta.env.VITE_API_URL}/api/nominees`),
        apiService.get(`${import.meta.env.VITE_API_URL}/api/ambassadors`),
      ]);

      if (!sessionData.success || !sessionData.email) {
        throw new Error("Failed to fetch session data");
      }

      if (profileData.success && profileData.profile) {
        const updatedProfile = {
          first_name: profileData.profile.first_name || "",
          middle_name: profileData.profile.middle_name || "",
          last_name: profileData.profile.last_name || "",
          email: sessionData.email,
          phone_number: profileData.profile.phone_number || "",
          date_of_birth: profileData.profile.date_of_birth || "",
          gender: profileData.profile.gender || "",
          address_line_1: profileData.profile.address_line_1 || "",
          address_line_2: profileData.profile.address_line_2 || "",
          city: profileData.profile.city || "",
          state: profileData.profile.state || "",
          zip_code: profileData.profile.zip_code || "",
          country: profileData.profile.country || "",
          profile_image: profileData.profile.profile_image || "",
        };
        setProfile(updatedProfile);
        setUserId(sessionData.userId || profileData.profile.userId || null);
        setImagePreview(
          profileData.profile.profile_image
            ? `${import.meta.env.VITE_API_URL}${profileData.profile.profile_image}`
            : null
        );
      }

      if (nomineesData.success) {
        setNomineeCount(nomineesData.nominees.length);
      }

      if (ambassadorsData.success) {
        setAmbassadorCount(ambassadorsData.ambassadors.length);
      }
    } catch (err) {
      setError("Failed to fetch profile or session data");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch biometric status
  useEffect(() => {
    fetchProfile();

    const checkBiometricStatus = async () => {
      if (!userId) {
        toast.error("User ID not found.");
        setBiometricLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/check-biometric`,
          {
            params: { biometricType: "fingerprint" },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setIsFingerprintRegistered(response.data.isRegistered);
        } else {
          toast.error("Failed to check biometric status.");
        }
      } catch (err) {
        toast.error("Error checking biometric status.");
      } finally {
        setBiometricLoading(false);
      }
    };

    if (userId) {
      checkBiometricStatus();
    }
  }, [userId]);

  // Handle image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    // Set preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const imagePath = response.data.imagePath;
        setProfile((prev) => ({
          ...prev,
          profile_image: imagePath,
        }));
        setImagePreview(`${import.meta.env.VITE_API_URL}${imagePath}`);
        toast.success("Profile image uploaded successfully!");
      } else {
        toast.error(response.data.message || "Failed to upload image.");
        setImagePreview(
          profile.profile_image ? `${import.meta.env.VITE_API_URL}${profile.profile_image}` : null
        );
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error uploading image.";
      toast.error(errorMessage);
      setImagePreview(
        profile.profile_image ? `${import.meta.env.VITE_API_URL}${profile.profile_image}` : null
      );
      console.error("Image upload error:", err);
    } finally {
      setImageUploading(false);
    }
  };

  // Debounced address suggestions
  const fetchAddressSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=08738c570aa84e58949d12371cf7f978&limit=5`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAddressSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        setError("Failed to fetch address suggestions");
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  // Handle address selection
  const handleAddressSelect = (result) => {
    const components = result.components;
    const formatted = result.formatted;

    // Split the formatted address into parts based on commas
    const addressParts = formatted.split(",").map(part => part.trim());

    // Initialize address fields
    let addressLine1 = "";
    let addressLine2 = "";
    let city = components.city || components.town || components.village || "";
    let state = components.state || "";
    let zipCode = components.postcode || "";
    let country = components.country || "";

    // Handle address parts based on length and context
    if (addressParts.length > 0) {
      addressLine1 = addressParts[0];
      if (addressParts.length > 1) {
        addressLine2 = addressParts.slice(1, addressParts.length - 3).join(", ");
      }
      if (addressParts.length >= 3) {
        city = city || addressParts[addressParts.length - 3] || "";
        state = state || addressParts[addressParts.length - 2] || "";
        country = country || addressParts[addressParts.length - 1] || "";
      }
    }

    setProfile((prev) => ({
      ...prev,
      address_line_1: addressLine1 || components.building || components.road || "",
      address_line_2: addressLine2 || components.suburb || components.neighbourhood || "",
      city,
      state,
      zip_code: zipCode,
      country,
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiService.put(
        `${import.meta.env.VITE_API_URL}/api/update-profile`,
        profile
      );
      if (response.success) {
        setSuccessMessage("Profile updated successfully");
        await fetchProfile();
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New password and confirm password do not match");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Updating password:", passwordData);
      setSuccessMessage("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError("Failed to update password");
      console.error("Error updating password:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile input changes
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "address_line_1") {
      fetchAddressSuggestions(value);
    }
  };

  // Handle password input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle auth toggle
  const handleAuthToggle = (option) => {
    setAuthOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Handle profile cancel
  const handleProfileCancel = () => {
    fetchProfile();
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle password cancel
  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Handle biometric registration
  const handleBiometricRegistration = async (type) => {
    if (!userId) {
      toast.error("User ID not found. Please try registering again.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register-biometric`,
        { email: profile.email, userId, biometricType: type },
        { withCredentials: true }
      );

      if (response.data.success) {
        const options = response.data.options;
        const regResponse = await startRegistration(options);

        const verificationResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/verify-biometric-registration`,
          { response: regResponse, userId, biometricType: type },
          { withCredentials: true }
        );

        if (verificationResponse.data.success) {
          toast.success(response.data.message);
          toast.success(`${type === "face" ? "Face ID" : "Fingerprint"} registration successful!`);
          setIsFingerprintRegistered(true);
        } else {
          toast.error(`${type === "face" ? "Face ID" : "Fingerprint"} registration verification failed.`);
        }
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.name === "NotAllowedError" && type === "face"
          ? "Your device does not support Face ID or permission was denied."
          : `${type === "face" ? "Face ID" : "Fingerprint"} registration failed.`);
      toast.error(errorMessage);
    }
  };

  // Handle biometric deletion
  const handleBiometricDeletion = async (type) => {
    if (!userId) {
      toast.error("User ID not found.");
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/delete-biometric`,
        {
          data: { biometricType: type },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setIsFingerprintRegistered(false);
        setShowDeleteFingerprintConfirm(false);
      } else {
        toast.error(`Failed to delete ${type === "face" ? "Face ID" : "Fingerprint"}.`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        `Error deleting ${type === "face" ? "Face ID" : "Fingerprint"}.`
      );
    }
  };

  const handleShowDeleteFingerprintConfirm = () => {
    setShowDeleteFingerprintConfirm(true);
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>
      <p className="profile-subtitle">
        Manage your personal information and account settings.
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isLoading && <div className="loading">Loading...</div>}

      <div className="profile-content">
        {/* Left Panel */}
        <div className="profile-left">
          <div className="profile-card">
            <div className="profile-image-container" style={{ position: "relative" }}>
              {imagePreview || profile.profile_image ? (
                <img
                  src={imagePreview || `${import.meta.env.VITE_API_URL}${profile.profile_image}`}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-initials">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name[0]}${profile.last_name[0]}`
                    : "NA"}
                </div>
              )}
              <label
                htmlFor="profile-upload"
                style={{
                  cursor: imageUploading ? "progress" : "pointer",
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                }}
              >
                {imageUploading ? (
                  <span className="profile-upload-loading">Uploading...</span>
                ) : (
                  <img src={Camera} className="profile-edit-icon" alt="Upload" />
                )}
                <input
                  type="file"
                  id="profile-upload"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  disabled={imageUploading}
                />
              </label>
            </div>
            <h3 className="profile-name">{`${profile.first_name} ${profile.middle_name} ${profile.last_name}`}</h3>
            <p className="profile-email">{profile.email || "N/A"}</p>
            <hr className="profile-line" />
            <ul className="profile-details">
              <li>
                <span className="profile-heading">Account Status</span>
                <span className="profile-badge profile-active">Active</span>
              </li>
              <li>
                <span className="profile-heading">Subscription</span>
                <span className="profile-answer">Annual Plan</span>
              </li>
              <li>
                <span className="profile-heading">Ambassadors</span>
                <span className="profile-answer">{ambassadorCount} Assigned</span>
              </li>
              <li>
                <span className="profile-heading">Nominees</span>
                <span className="profile-answer">{nomineeCount} Contacts</span>
              </li>
            </ul>
          </div>

          <div className="profile-verification-card">
            <h4 className="profile-card-heading">Account Verification</h4>
            <ul className="profile-verification-list">
              <li className="profile-verification-item">
                <img src={check} alt="Verified" className="profile-verification-icon" />
                <div className="profile-verification-text">
                  <strong>Email Verified</strong>
                  <p>Your email has been verified</p>
                </div>
              </li>
              <li className="profile-verification-item">
                <img src={check} alt="Verified" className="profile-verification-icon" />
                <div className="profile-verification-text">
                  <strong>Phone Verified</strong>
                  <p>Your phone number has been verified</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="profile-right">
          {/* Profile Info Form */}
          <form className="profile-info-form" onSubmit={handleProfileSubmit}>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleProfileInputChange}
                  required
                />
              </div>
              <div className="profile-input-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={profile.middle_name}
                  onChange={handleProfileInputChange}
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleProfileInputChange}
                />
              </div>
              <div className="profile-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileInputChange}
                  required
                  readOnly
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleProfileInputChange}
                />
              </div>
              <div className="profile-input-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleProfileInputChange}
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileInputChange}
                  className="profile-popups-input"
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="profile-input-group profile-address-input-group">
                <label>Flat/Building No</label>
                <input
                  type="text"
                  name="address_line_1"
                  value={profile.address_line_1}
                  onChange={handleProfileInputChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <ul className="profile-address-suggestions">
                    {addressSuggestions.map((result, index) => (
                      <li
                        key={index}
                        className="profile-address-suggestion-item"
                        onClick={() => handleAddressSelect(result)}
                      >
                        {result.formatted}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>Street</label>
                <input
                  type="text"
                  name="address_line_2"
                  value={profile.address_line_2}
                  onChange={handleProfileInputChange}
                />
              </div>
              <div className="profile-input-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleProfileInputChange}
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={profile.state}
                  onChange={handleProfileInputChange}
                />
              </div>
              <div className="profile-input-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={profile.country}
                  onChange={handleProfileInputChange}
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="profile-input-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  name="zip_code"
                  value={profile.zip_code}
                  onChange={handleProfileInputChange}
                />
              </div>
              <div className="profile-input-group"></div>
            </div>
            <div className="profile-form-buttons">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={handleProfileCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="profile-save-btn"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Password & Security Card */}
          <div className="profile-password-card">
            <h4>Password & Security</h4>
            <form onSubmit={handlePasswordSubmit}>
              <div className="profile-form-row">
                <div className="profile-input-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    required
                  />
                </div>
                <div className="profile-input-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                  />
                </div>
              </div>
              <div className="profile-form-row">
                <div className="profile-input-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                  />
                </div>
                <div className="profile-input-group"></div>
              </div>

              <h5>Two-Factor Authentication</h5>
              <ul className="profile-auth-options">
                <li>
                  <div>
                    <p className="profile-auth-text">Email Authentication</p>
                    <p className="profile-auth-subtext">
                      Receive codes via email
                    </p>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={authOptions.emailAuth}
                      onChange={() => handleAuthToggle("emailAuth")}
                    />
                    <span className="profile-slider round"></span>
                  </label>
                </li>
                <li>
                  <div>
                    <p className="profile-auth-text">SMS Notifications</p>
                    <p className="profile-auth-subtext">
                      Receive updates and alerts via text message
                    </p>
                  </div>
                  <label className="profile-switch">
                    <input
                      type="checkbox"
                      checked={authOptions.smsNotifications}
                      onChange={() => handleAuthToggle("smsNotifications")}
                    />
                    <span className="profile-slider round"></span>
                  </label>
                </li>
              </ul>
              <div className="profile-form-buttons">
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={handlePasswordCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Way to Sign In Section */}
          <div className="profile-signin-card">
            <h4>Way to Sign In</h4>
            {biometricLoading ? (
              <div>Loading...</div>
            ) : (
              <p
                className="profile-fingerprint"
                onClick={() =>
                  isFingerprintRegistered
                    ? handleShowDeleteFingerprintConfirm()
                    : handleBiometricRegistration("fingerprint")
                }
              >
                <img
                  src={fingerprint}
                  className="profile-biometric-icon"
                  alt="Fingerprint icon"
                />
                {isFingerprintRegistered ? "Delete Fingerprint" : "Add Fingerprint"}
              </p>
            )}
            {showDeleteFingerprintConfirm && (
              <div className="delete-fingerprint-confirm-popup-backdrop">
                <div className="delete-fingerprint-confirm-popup">
                  <button
                    className="delete-fingerprint-confirm-close"
                    onClick={() => setShowDeleteFingerprintConfirm(false)}
                  >
                    ×
                  </button>
                  <h3 className="delete-fingerprint-confirm-heading">Confirm Deletion</h3>
                  <p className="delete-fingerprint-confirm-message">
                    Are you sure you want to delete your fingerprint? This action cannot be undone.
                  </p>
                  <div className="delete-fingerprint-confirm-actions">
                    <button
                      className="profile-cancel-btn"
                      onClick={() => setShowDeleteFingerprintConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="profile-save-btn delete"
                      onClick={() => handleBiometricDeletion("fingerprint")}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
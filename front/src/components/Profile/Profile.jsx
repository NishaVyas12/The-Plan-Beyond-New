import "./Profile.css";
import userImg from "../../assets/images/Profile/image.svg";
import Camera from "../../assets/images/Profile/Camera.svg";
import check from "../../assets/images/Profile/check.svg";
import cross from "../../assets/images/Profile/cross.svg";
import fingerprint from "../../assets/images/Profile/fingerprint.svg";
import { apiService } from "../../services/apiService";
import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Function to fetch profile data
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch session data to get email
      const sessionData = await apiService.get(`${import.meta.env.VITE_API_URL}/api/check-session`);
      if (!sessionData.success || !sessionData.email) {
        throw new Error("Failed to fetch session data");
      }

      // Fetch profile data
      const profileData = await apiService.get(`${import.meta.env.VITE_API_URL}/api/get-profile`);
      if (profileData.success && profileData.profile) {
        setProfile({
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
        });
      }
    } catch (err) {
      setError("Failed to fetch profile or session data");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Debounced function to fetch address suggestions
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

  // Handle address selection from suggestions
  const handleAddressSelect = (result) => {
    const components = result.components;
    setProfile((prev) => ({
      ...prev,
      address_line_1: components.road || components.building || "",
      address_line_2: components.suburb || components.neighbourhood || "",
      city: components.city || components.town || components.village || "",
      state: components.state || "",
      zip_code: components.postcode || "",
      country: components.country || "",
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "address_line_1") {
      fetchAddressSuggestions(value);
    }
  };

  // Handle cancel button to reset form
  const handleCancel = () => {
    fetchProfile();
    setAddressSuggestions([]);
    setShowSuggestions(false);
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
            <div className="profile-image-container">
              <img src={userImg} alt="Profile" className="profile-image" />
              <img src={Camera} className="edit-icon" alt="" />
            </div>
            <h3 className="profile-name">{`${profile.first_name} ${profile.middle_name} ${profile.last_name}`}</h3>
            <p className="profile-email">{profile.email || "NA"}</p>
            <p className="profile-joined">Joined: Aug 2023</p>
            <hr className="line" />
            <ul className="profile-details">
              <li>
                <span className="heading">Account Status</span>
                <span className="badge active">Active</span>
              </li>
              <li>
                <span className="heading">Subscription</span>
                <span className="answer">Annual Plan</span>
              </li>
              <li>
                <span className="heading">Ambassadors</span>
                <span className="answer">2 Assigned</span>
              </li>
              <li>
                <span className="heading">Nominees</span>
                <span className="answer">24 Contacts</span>
              </li>
            </ul>
          </div>

          <div className="verification-card">
            <h4 className="card-heading">Account Verification</h4>
            <ul className="verification-list">
              <li className="verification-item">
                <img src={check} alt="Verified" className="verification-icon" />
                <div className="verification-text">
                  <strong>Email Verified</strong>
                  <p>Your email has been verified</p>
                </div>
              </li>
              <li className="verification-item">
                <img src={check} alt="Verified" className="verification-icon" />
                <div className="verification-text">
                  <strong>Phone Verified</strong>
                  <p>Your phone number has been verified</p>
                </div>
              </li>
              <li className="verification-item">
                <img src={cross} alt="Not Verified" className="verification-icon" />
                <div className="verification-text">
                  <strong>ID Verification Pending</strong>
                  <p>Upload a government ID to verify your identity</p>
                </div>
              </li>
            </ul>
            <button className="complete-btn">Complete Verification</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="profile-right">
          <form className="info-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={profile.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={profile.middle_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={profile.last_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={profile.phone_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Date Of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleInputChange}
                  className="popups-input"
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="input-group address-input-group">
                <label>Flat/ Building No</label>
                <input
                  type="text"
                  name="address_line_1"
                  value={profile.address_line_1}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && addressSuggestions.length > 0 && (
                  <ul className="address-suggestions">
                    {addressSuggestions.map((result, index) => (
                      <li
                        key={index}
                        className="address-suggestion-item"
                        onClick={() => handleAddressSelect(result)}
                      >
                        {result.formatted}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="input-group">
                <label>Street</label>
                <input
                  type="text"
                  name="address_line_2"
                  value={profile.address_line_2}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={profile.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  name="zip_code"
                  value={profile.zip_code}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={profile.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="password-card">
            <h4>Password & Security</h4>
            <div className="form-row">
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Confirm New Password</label>
                <input type="password" />
              </div>
            </div>

            <h5>Two-Factor Authentication</h5>
            <ul className="auth-options">
              <li>
                <div>
                  <p className="auth-text">Authenticator App</p>
                  <p className="auth-subtext">
                    Use an app like Google Authenticator
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </li>
              <li>
                <div>
                  <p className="auth-text">Email Authentication</p>
                  <p className="auth-subtext">
                    Receive codes via email
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </li>
              <li>
                <div>
                  <p className="auth-text">SMS Notifications</p>
                  <p className="auth-subtext">
                    Receive updates and alerts via text message
                  </p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </li>
            </ul>
            <div className="form-buttons">
              <button type="button" className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Update Password
              </button>
            </div>
          </div>

          <div className="signin-card">
            <h4>Way to Sign In</h4>
            <p className="profile-fingerprint">
              <img
                src={fingerprint}
                className="profile-biometric-icon"
                alt=""
              />
              Add fingerprint
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

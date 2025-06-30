import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './FamilyInfo.css';

const FamilyInfo = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showPhone1, setShowPhone1] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    nickname: '',
    email: '',
    phone: '',
    phoneNumber1: '',
    phoneNumber2: '',
    phoneNumber3: '',
    flatBuildingNo: '',
    street: '',
    country: '',
    state: '',
    city: '',
    zipcode: '',
    profileImage: '',
    birthday: '',
    relation: '',
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const navigate = useNavigate();

  const fetchFamilyInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to fetch family members.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
      toast.error('Error fetching family members. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts?all=true`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        const formattedContacts = data.contacts.map((contact) => ({
          id: contact.id,
          name: [contact.first_name, contact.middle_name, contact.last_name]
            .filter(Boolean)
            .join(' ')
            .trim(),
          first_name: contact.first_name || '',
          middle_name: contact.middle_name || '',
          last_name: contact.last_name || '',
          phone: contact.phone_number || '',
          email: contact.email || '',
          phone_number1: contact.phone_number1 || '',
          phone_number2: contact.phone_number2 || '',
          phone_number3: contact.phone_number3 || '',
          flat_building_no: contact.flat_building_no || '',
          street: contact.street || '',
          country: contact.country || '',
          state: contact.state || '',
          city: contact.city || '',
          postal_code: contact.postal_code || '',
          contact_image: contact.contact_image || '',
          date_of_birth: contact.date_of_birth || '',
          relation: contact.relation || '',
        }));
        setContacts(formattedContacts);
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to fetch contacts.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      toast.error('Error fetching contacts. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    fetchFamilyInfo();
    fetchAllContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSearchQuery('');
    setIsSearchFocused(false);
    setShowPhone1(false);
    setShowPhone2(false);
    setFilteredContacts([]);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      nickname: '',
      email: '',
      phone: '',
      phoneNumber1: '',
      phoneNumber2: '',
      phoneNumber3: '',
      flatBuildingNo: '',
      street: '',
      country: '',
      state: '',
      city: '',
      zipcode: '',
      profileImage: '',
      birthday: '',
      relation: '',
    });
  };

  const handleAddPhoneNumber = () => {
    if (!showPhone1) {
      setShowPhone1(true);
    } else if (!showPhone2) {
      setShowPhone2(true);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          nickname: formData.nickname,
          email: formData.email,
          phone_number: formData.phone,
          phone_number1: formData.phoneNumber1,
          phone_number2: formData.phoneNumber2,
          phone_number3: formData.phoneNumber3,
          flat_building_no: formData.flatBuildingNo,
          street: formData.street,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          zipcode: formData.zipcode,
          profile_image: formData.profileImage,
          birthday: formData.birthday,
          relation: formData.relation,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Family member saved successfully.', {
          position: 'top-right',
          autoClose: 3000,
        });
        handleCloseDrawer();
        await fetchFamilyInfo();
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to save family member.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error saving family member:', err);
      toast.error('Error saving family member. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleSelectContact = (contact) => {
    setFormData({
      firstName: contact.first_name || '',
      middleName: contact.middle_name || '',
      lastName: contact.last_name || '',
      nickname: contact.nickname || '',
      email: contact.email || '',
      phone: contact.phone || '',
      phoneNumber1: contact.phone_number1 || '',
      phoneNumber2: contact.phone_number2 || '',
      phoneNumber3: contact.phone_number3 || '',
      flatBuildingNo: contact.flat_building_no || '',
      street: contact.street || '',
      country: contact.country || '',
      state: contact.state || '',
      city: contact.city || '',
      zipcode: contact.postal_code || '',
      profileImage: contact.contact_image || '',
      birthday: contact.date_of_birth || '',
      relation: contact.relation || '',
    });
    setShowPhone1(!!contact.phone_number1);
    setShowPhone2(!!contact.phone_number2);
    setSearchQuery(contact.name);
    setIsSearchFocused(false);
    setFilteredContacts([]);
  };

  const getInitials = (firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return 'NA';
  };

  const handleCardClick = (id) => {
    navigate(`/family-detail/${id}`);
  };

  return (
    <div className="family-id-add-contact-page">
      <ToastContainer />
      <div className="family-id-contact-header">
        <div className="family-id-contact-header-actions">
          <h1 className="family-id-add-contact-title">Family Info and IDs</h1>
          <button className="family-id-contact-add-button" onClick={handleAddClick}>
            + Add
          </button>
        </div>
      </div>
      <div className="family-id-card-container">
        {familyMembers.map((member, index) => (
          <div key={index} className="family-id-card" onClick={() => handleCardClick(member.id)}>
            <div className="family-id-card-content">
              <div className="family-id-avatar-wrapper">
                <div
                  className="family-id-avatar"
                  style={
                    member.profile_image
                      ? { backgroundImage: `url(${import.meta.env.VITE_API_URL}${member.profile_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : {}
                  }
                >
                  {!member.profile_image && <span>{getInitials(member.first_name, member.last_name)}</span>}
                </div>
              </div>
              <div className="family-id-details">
                <div className="family-id-name-options">
                  <h3 className="family-id-card-name">
                    {`${member.first_name} ${member.last_name}`.trim() || 'Not Assigned'}
                  </h3>
                  <span className="family-id-card-options">...</span>
                </div>
               
                <p className="family-id-card-value">{member.relation || '-'}</p>
              </div>
            </div>
            <div className="family-id-card-info">
              <p className="family-id-card-label">Birthday</p>
              <p className="family-id-card-value">{member.birthday || '-'}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="family-id-add-contact-drawer-backdrop"
        style={{ display: isDrawerOpen ? 'block' : 'none' }}
        onClick={handleCloseDrawer}
      ></div>
      <div className={`family-id-add-contact-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="family-id-add-contact-drawer-top">
          <button className="family-id-add-contact-drawer-close" onClick={handleCloseDrawer}>
            ×
          </button>
        </div>
        <div className="family-id-add-contact-drawer-divider"></div>
        <h2 className="family-id-add-contact-drawer-heading">Add Family Member</h2>
        <div className="family-id-add-contact-form-content">
          <div className="family-id-add-contact-form-group full-width">
            <label className="family-id-add-contact-form-label">Search Contact</label>
            <input
              type="text"
              className="family-id-add-contact-form-input"
              placeholder="Search existing contacts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            {isSearchFocused && (
              <div className="family-id-contact-search-dropdown">
                {(searchQuery ? filteredContacts : contacts).map((contact) => (
                  <div
                    key={contact.id}
                    className="family-id-contact-search-option"
                    onClick={() => handleSelectContact(contact)}
                  >
                    {contact.name} ({contact.phone})
                  </div>
                ))}
                {(searchQuery ? filteredContacts : contacts).length === 0 && (
                  <div className="family-id-contact-search-option">
                    No contacts found
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="family-id-add-contact-form-row">
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="family-id-add-contact-form-input"
                value={formData.firstName}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Middle Name</label>
              <input
                type="text"
                name="middleName"
                className="family-id-add-contact-form-input"
                value={formData.middleName}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="family-id-add-contact-form-input"
                value={formData.lastName}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
          </div>
          <div className="family-id-add-contact-form-row">
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Nickname</label>
              <input
                type="text"
                name="nickname"
                className="family-id-add-contact-form-input"
                value={formData.nickname}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Email</label>
              <input
                type="email"
                name="email"
                className="family-id-add-contact-form-input"
                value={formData.email}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Birthday</label>
              <input
                type="date"
                name="birthday"
                className="family-id-add-contact-form-input"
                value={formData.birthday}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Relation</label>
              <input
                type="text"
                name="relation"
                className="family-id-add-contact-form-input"
                value={formData.relation}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                placeholder="e.g., Mother, Father, Sibling"
              />
            </div>
          </div>
          <div className="family-id-add-contact-form-row">
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Phone</label>
              <PhoneInput
                country="in"
                value={formData.phone}
                onChange={(phone) => handleInputChange('phone', phone)}
                inputClass="family-id-add-contact-form-input"
                containerClass="family-id-add-contact-phone-input-container"
                enableSearch
                disableDropdown={false}
              />
            </div>
            {showPhone1 && (
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Phone Number 1</label>
                <PhoneInput
                  country="in"
                  value={formData.phoneNumber1}
                  onChange={(phone) => handleInputChange('phoneNumber1', phone)}
                  inputClass="family-id-add-contact-form-input"
                  containerClass="family-id-add-contact-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {showPhone2 && (
              <div className="family-id-add-contact-form-group">
                <label className="family-id-add-contact-form-label">Phone Number 2</label>
                <PhoneInput
                  country="in"
                  value={formData.phoneNumber2}
                  onChange={(phone) => handleInputChange('phoneNumber2', phone)}
                  inputClass="family-id-add-contact-form-input"
                  containerClass="family-id-add-contact-phone-input-container"
                  enableSearch
                  disableDropdown={false}
                />
              </div>
            )}
            {(!showPhone1 || !showPhone2) && (
              <div className="family-id-add-contact-form-group full-width">
                <button
                  type="button"
                  className="family-id-add-contact-form-button add-number"
                  onClick={handleAddPhoneNumber}
                >
                  + Add Another Number
                </button>
              </div>
            )}
          </div>
          <div className="family-id-add-contact-form-row">
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Flat/Building No</label>
              <input
                type="text"
                name="flatBuildingNo"
                className="family-id-add-contact-form-input"
                value={formData.flatBuildingNo}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Street</label>
              <input
                type="text"
                name="street"
                className="family-id-add-contact-form-input"
                value={formData.street}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Country</label>
              <input
                type="text"
                name="country"
                className="family-id-add-contact-form-input"
                value={formData.country}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
          </div>
          <div className="family-id-add-contact-form-row">
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">State</label>
              <input
                type="text"
                name="state"
                className="family-id-add-contact-form-input"
                value={formData.state}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">City</label>
              <input
                type="text"
                name="city"
                className="family-id-add-contact-form-input"
                value={formData.city}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
            <div className="family-id-add-contact-form-group">
              <label className="family-id-add-contact-form-label">Zipcode</label>
              <input
                type="text"
                name="zipcode"
                className="family-id-add-contact-form-input"
                value={formData.zipcode}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              />
            </div>
          </div>
          <div className="family-id-add-contact-form-actions">
            <button className="family-id-add-contact-form-button cancel" onClick={handleCloseDrawer}>
              Cancel
            </button>
            <button className="family-id-add-contact-form-button save" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyInfo;
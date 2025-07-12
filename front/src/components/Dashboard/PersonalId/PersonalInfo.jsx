import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PersonalInfo.css';
import plusIcon from '../../../assets/images/Documents/vector.svg';
import EmploymentPopup from './EmploymentPopup';
import IdsPopup from './IdsPopup';
import ReligionPopup from './ReligionPopup';
import CharitiesPopup from './CharitiesPopup';
import ClubsPopup from './ClubsPopup';
import DegreesPopup from './DegreesPopup';
import MilitaryPopup from './MilitaryPopup';
import MiscellaneousPopup from './MiscellaneousPopup';
import uploadIcon from '../../../assets/images/dash_icon/upload.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const infoItems = [
  { name: 'IDs and Vital Documentation', id: 'ids', endpoint: 'ids' },
  { name: 'Employment', id: 'employment', endpoint: 'employment' },
  { name: 'Religion', id: 'religion', endpoint: 'religion' },
  { name: 'Charities & Causes', id: 'charities', endpoint: 'charity' },
  { name: 'Clubs and Affiliations', id: 'clubs', endpoint: 'club' },
  { name: 'Degrees and Certifications', id: 'degrees', endpoint: 'degrees' },
  { name: 'Military Service', id: 'military', endpoint: 'military' },
  { name: 'Miscellaneous', id: 'miscellaneous', endpoint: 'miscellaneous' },
];

const PersonalInfo = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [counts, setCounts] = useState({});
  const addDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    number: '',
    location: '',
    expirationDate: '',
    stateIssued: '',
    countryIssued: '',
    files: null,
    notes: '',
    organisation: '',
    joiningDate: '',
    leavingDate: '',
    supervisorContact: '',
    nomineeContact: '',
    employmentType: '',
    jobTitle: '',
    employmentId: '',
    benefitsType: '',
    benefitsDetails: '',
    otherStatus: '',
    religion: '',
    religion1: '',
    charity_name: '',
    charity_website: '',
    payment_method: '',
    amount: '',
    frequency: '',
    enrolled: '',
    club: '',
    club_name: '',
    club_contact: '',
    membership_type: '',
    membership_status: '',
    university_name: '',
    degree: '',
    degree_field: '',
    degree_start: '',
    degree_end: '',
    grade: '',
    activities: '',
    degree_type: '',
    completion_status: '',
    military_branch: '',
    military_name: '',
    military_rank: '',
    military_serve: '',
    military_location: '',
    service_type: '',
    service_status: '',
    item: '',
    description: '',
    category: '',
    status: '',
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts = {};
      for (const item of infoItems) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${item.endpoint}`, {
            method: 'GET',
            credentials: 'include',
          });
          const result = await response.json();
          if (item.id === 'religion') {
            newCounts[item.id] = Array.isArray(result) ? result.length : 0;
          } else {
            newCounts[item.id] = result.success && result.documents ? result.documents.length : 0;
          }
        } catch (error) {
          console.error(`Error fetching count for ${item.id}:`, error);
          newCounts[item.id] = 0;
        }
      }
      setCounts(newCounts);
    };
    fetchCounts();
  }, []);

  const handleCardClick = (item) => {
    if (item.id === 'religion' && counts[item.id] === 0) {
      setSelectedItem(item.name);
      setIsDrawerOpen(true);
      setIsAddDropdownOpen(false);
    } else {
      navigate(`/personal-info/${item.id}`);
    }
  };

  const handleAddOptionSelect = (item) => {
    if (item.id === 'religion' && counts[item.id] === 0) {
      setSelectedItem(item.name);
      setIsDrawerOpen(true);
      setIsAddDropdownOpen(false);
    } else {
      navigate(`/personal-info/${item.id}`);
    }
  };

  const handleAddButtonClick = () => {
    setIsAddDropdownOpen((prev) => !prev);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
    setFormData({
      type: '',
      number: '',
      location: '',
      expirationDate: '',
      stateIssued: '',
      countryIssued: '',
      files: null,
      notes: '',
      organisation: '',
      joiningDate: '',
      leavingDate: '',
      supervisorContact: '',
      nomineeContact: '',
      employmentType: '',
      jobTitle: '',
      employmentId: '',
      benefitsType: '',
      benefitsDetails: '',
      otherStatus: '',
      religion: '',
      religion1: '',
      charity_name: '',
      charity_website: '',
      payment_method: '',
      amount: '',
      frequency: '',
      enrolled: '',
      club: '',
      club_name: '',
      club_contact: '',
      membership_type: '',
      membership_status: '',
      university_name: '',
      degree: '',
      degree_field: '',
      degree_start: '',
      degree_end: '',
      grade: '',
      activities: '',
      degree_type: '',
      completion_status: '',
      military_branch: '',
      military_name: '',
      military_rank: '',
      military_serve: '',
      military_location: '',
      service_type: '',
      service_status: '',
      item: '',
      description: '',
      category: '',
      status: '',
    });
    // Refresh counts after closing drawer to reflect any new records
    const fetchCounts = async () => {
      const newCounts = {};
      for (const item of infoItems) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${item.endpoint}`, {
            method: 'GET',
            credentials: 'include',
          });
          const result = await response.json();
          if (item.id === 'religion') {
            newCounts[item.id] = Array.isArray(result) ? result.length : 0;
          } else {
            newCounts[item.id] = result.success && result.documents ? result.documents.length : 0;
          }
        } catch (error) {
          console.error(`Error fetching count for ${item.id}:`, error);
          newCounts[item.id] = 0;
        }
      }
      setCounts(newCounts);
    };
    fetchCounts();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target)) {
        setIsAddDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files) {
      setFormData((prev) => ({ ...prev, files }));
    }
  };

  const handleSubmit = async (e, popupSpecificSubmit) => {
    e.preventDefault();
    if (popupSpecificSubmit) {
      const result = await popupSpecificSubmit(e, formData, handleCloseDrawer);
      if (result.success) {
        toast.success(result.message, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        handleCloseDrawer();
      } else {
        toast.error(result.message, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  };

  const documentTypes = [
    'Social Security Card',
    'Aadhaar Card',
    'Voter ID',
    'Passport',
    'Driver’s License',
    'PAN Card',
    'Other ID',
  ];

  const nomineeContacts = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com' },
  ];

  const allContacts = [
    { id: '1', name: 'Club Admin', phone_number: '+1234567890' },
    { id: '2', name: 'Event Coordinator', phone_number: '+0987654321' },
  ];

  const categories = [
    { id: 'ids', label: 'IDs and Vital Documentation' },
    { id: 'employment', label: 'Employment' },
    { id: 'religion', label: 'Religion' },
    { id: 'charities', label: 'Charities & Causes' },
    { id: 'clubs', label: 'Clubs and Affiliations' },
    { id: 'degrees', label: 'Degrees and Certifications' },
    { id: 'military', label: 'Military Service' },
    { id: 'miscellaneous', label: 'Miscellaneous' },
  ];

  const renderPopup = () => {
    if (selectedItem === 'IDs and Vital Documentation') {
      return (
        <IdsPopup
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, IdsPopup.handleSubmit)}
          documentTypes={documentTypes}
          uploadIcon={uploadIcon}
          handleCloseModal={handleCloseDrawer}
        />
      );
    } else if (selectedItem === 'Employment') {
      return (
        <EmploymentPopup
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, EmploymentPopup.handleSubmit)}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    } else if (selectedItem === 'Religion') {
      return (
        <ReligionPopup
          formData={formData}
          handleInputChange={handleInputChange}
          nomineeContacts={nomineeContacts}
          handleSubmit={(e) => handleSubmit(e, ReligionPopup.handleSubmit)}
          categories={categories}
          handleCloseModal={handleCloseDrawer}
        />
      );
    } else if (selectedItem === 'Charities & Causes') {
      return (
        <CharitiesPopup
          formData={formData}
          handleInputChange={handleInputChange}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, CharitiesPopup.handleSubmit)}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    } else if (selectedItem === 'Clubs and Affiliations') {
      return (
        <ClubsPopup
          formData={formData}
          handleInputChange={handleInputChange}
          allContacts={allContacts}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, ClubsPopup.handleSubmit)}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    } else if (selectedItem === 'Degrees and Certifications') {
      return (
        <DegreesPopup
          formData={formData}
          handleInputChange={handleInputChange}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, DegreesPopup.handleSubmit)}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    } else if (selectedItem === 'Military Service') {
      return (
        <MilitaryPopup
          formData={formData}
          handleInputChange={handleInputChange}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, MilitaryPopup.handleSubmit)}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    } else if (selectedItem === 'Miscellaneous') {
      return (
        <MiscellaneousPopup
          formData={formData}
          handleInputChange={handleInputChange}
          nomineeContacts={nomineeContacts}
          handleCloseModal={handleCloseDrawer}
          handleFileChange={handleFileChange}
          handleSubmit={(e) => handleSubmit(e, MiscellaneousPopup.handleSubmit)}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    }
    return null;
  };

  return (
    <div className="personal-info-container">
      <ToastContainer />
      <div className="personal-info-header">
        <h2 className="personal-info-title">Personal Info and IDs</h2>
        <div className="personal-add-button-container" ref={addDropdownRef}>
          <button className="personal-add-button" onClick={handleAddButtonClick}>
            Add <span className="personal-add-button-arrow">▾</span>
          </button>
          {isAddDropdownOpen && (
            <ul className="personal-add-dropdown-menu">
              {infoItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleAddOptionSelect(item)}
                  className={`personal-add-dropdown-option ${item.id === 'religion' && counts[item.id] > 0 ? 'disabled' : ''}`}
                >
                  {item.name} {counts[item.id] > 0 ? `(${counts[item.id]})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="personal-info-grid">
        {infoItems.map((item) => (
          <div
            key={item.id}
            className={`personal-info-card ${item.id === 'religion' && counts[item.id] > 0 ? 'disabled' : ''}`}
            onClick={() => handleCardClick(item)}
          >
            <div className="personal-info-icon">
              <img src={plusIcon} alt="Info Icon" className="icon-image" />
            </div>
            <span className="personal-info-label">
              {item.name} {counts[item.id] > 0 ? `(${counts[item.id]})` : ''}
            </span>
          </div>
        ))}
      </div>
      <div
        className="personal-info-drawer-backdrop"
        style={{ display: isDrawerOpen ? 'block' : 'none' }}
        onClick={handleCloseDrawer}
      ></div>
      <div className={`personal-info-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="personal-info-drawer-top">
          <button className="personal-info-drawer-close" onClick={handleCloseDrawer}>
            ×
          </button>
        </div>
        <div className="personal-info-drawer-divider"></div>
        {renderPopup()}
      </div>
    </div>
  );
};

export default PersonalInfo;
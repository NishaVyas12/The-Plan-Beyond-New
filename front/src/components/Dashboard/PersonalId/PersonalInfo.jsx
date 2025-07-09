import React, { useState } from 'react';
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

const infoItems = [
  'IDs and Vital Documentation',
  'Employment',
  'Religion',
  'Charities & Causes',
  'Clubs and Affiliations',
  'Degrees and Certifications',
  'Military Service',
  'Miscellaneous'
];

const PersonalInfo = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    number: '',
    location: '',
    expirationDate: '',
    stateIssued: '',
    countryIssued: '',
    file: null,
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
    files: null,
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

  const handleCardClick = (item) => {
    if (
      item === 'IDs and Vital Documentation' ||
      item === 'Employment' ||
      item === 'Religion' ||
      item === 'Charities & Causes' ||
      item === 'Clubs and Affiliations' ||
      item === 'Degrees and Certifications' ||
      item === 'Military Service' ||
      item === 'Miscellaneous'
    ) {
      setSelectedItem(item);
      setIsDrawerOpen(true);
    }
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
      file: null,
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
      files: null,
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
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData); // Replace with API call or further logic
    handleCloseDrawer();
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
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
          handleSubmit={handleSubmit}
          categories={categories}
          uploadIcon={uploadIcon}
        />
      );
    }
    return null;
  };

  return (
    <div className="personal-info-container">
      <h2 className="personal-info-title">Personal Info and IDs</h2>
      <div className="personal-info-grid">
        {infoItems.map((item, index) => (
          <div key={index} className="personal-info-card" onClick={() => handleCardClick(item)}>
            <div className="personal-info-icon">
              <img src={plusIcon} alt="Info Icon" className="icon-image" />
            </div>
            <span className="personal-info-label">{item}</span>
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
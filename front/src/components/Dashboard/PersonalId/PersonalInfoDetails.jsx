import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PersonalInfoDetails.css';
import EmploymentPopup from './EmploymentPopup';
import IdsPopup from './IdsPopup';
import ReligionPopup from './ReligionPopup';
import CharitiesPopup from './CharitiesPopup';
import ClubsPopup from './ClubsPopup';
import DegreesPopup from './DegreesPopup';
import MilitaryPopup from './MilitaryPopup';
import MiscellaneousPopup from './MiscellaneousPopup';
import uploadIcon from '../../../assets/images/dash_icon/upload.svg';
import imageIcon from '../../../assets/images/dash_icon/image.svg';
import pdfIcon from '../../../assets/images/dash_icon/pdf.svg';
import editIcon from '../../../assets/images/documents/Pen.svg';
import deleteIcon from '../../../assets/images/documents/trash.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const categories = [
  { id: 'ids', label: 'IDs and Vital Documentation', endpoint: 'ids', nameField: 'document_type' },
  { id: 'employment', label: 'Employment', endpoint: 'employment', nameField: 'organisation' },
  { id: 'religion', label: 'Religion', endpoint: 'religion', nameField: 'religion' },
  { id: 'charities', label: 'Charities & Causes', endpoint: 'charity', nameField: 'charity_name' },
  { id: 'clubs', label: 'Clubs and Affiliations', endpoint: 'club', nameField: 'club_name' },
  { id: 'degrees', label: 'Degrees and Certifications', endpoint: 'degrees', nameField: 'degree' },
  { id: 'military', label: 'Military Service', endpoint: 'military', nameField: 'military_name' },
  { id: 'miscellaneous', label: 'Miscellaneous', endpoint: 'miscellaneous', nameField: 'item' },
];

const PersonalInfoDetails = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    number: '',
    location: '',
    expirationDate: '',
    stateIssued: '',
    countryIssued: '',
    files: null,
    existingFiles: [],
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

  const category = categories.find((c) => c.id === categoryId);
  const endpoint = category?.endpoint;
  const nameField = category?.nameField;

  useEffect(() => {
    if (endpoint) {
      fetchRecords();
    }
  }, [endpoint]);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}`, {
        method: 'GET',
        credentials: 'include',
      });
      const result = await response.json();
      if (endpoint === 'religion') {
        setRecords(Array.isArray(result) ? result : []);
      } else {
        if (result.success) {
          setRecords(result.documents || []);
        } else {
          toast.error(result.message || 'Failed to fetch records.');
          setRecords([]);
        }
      }
    } catch (error) {
      toast.error('Error fetching records.');
      console.error('Fetch error:', error);
      setRecords([]);
    }
  };

  const handleAddButtonClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setFormData({
      type: '',
      number: '',
      location: '',
      expirationDate: '',
      stateIssued: '',
      countryIssued: '',
      files: null,
      existingFiles: [],
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
    fetchRecords();
  };

  const handleCloseViewDrawer = () => {
    setIsViewDrawerOpen(false);
    setSelectedRecord(null);
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

  const handleDropdownToggle = (recordId) => {
    setDropdownOpenId(dropdownOpenId === recordId ? null : recordId);
  };

  const handleView = (recordId) => {
    if (categoryId === 'ids') {
      const record = records.find((r) => r.id === recordId);
      if (record) {
        setSelectedRecord(record);
        setIsViewDrawerOpen(true);
      }
    }
    setDropdownOpenId(null);
  };

  const handleEdit = (recordId) => {
    if (categoryId === 'ids') {
      const record = records.find((r) => r.id === recordId);
      if (record) {
        setFormData({
          ...formData,
          id: record.id,
          type: record.document_type || '',
          number: record.document_number || '',
          expirationDate: record.expiration_date || '',
          stateIssued: record.state_issued || '',
          countryIssued: record.country_issued || '',
          location: record.location || '',
          notes: record.notes || '',
          files: null,
          existingFiles: record.file_path ? [{ name: record.file_name, path: record.file_path }] : [],
        });
        setIsDrawerOpen(true);
      }
    }
    setDropdownOpenId(null);
  };

  const handleDelete = async (recordId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/${endpoint}/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Record deleted successfully.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        fetchRecords();
      } else {
        toast.error(result.message || 'Failed to delete record.');
      }
    } catch (error) {
      toast.error('Error deleting record.');
      console.error('Delete error:', error);
    }
    setDropdownOpenId(null);
  };

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any dropdown menu
      if (!event.target.closest('.personal-document-actions')) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const renderPopup = () => {
    if (categoryId === 'ids') {
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
    } else if (categoryId === 'employment') {
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
    } else if (categoryId === 'religion') {
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
    } else if (categoryId === 'charities') {
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
    } else if (categoryId === 'clubs') {
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
    } else if (categoryId === 'degrees') {
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
    } else if (categoryId === 'military') {
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
    } else if (categoryId === 'miscellaneous') {
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

  const isImageFile = (filePath) => {
    if (!filePath) return false;
    const extension = filePath.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
  };

  const getFilePath = (record) => {
    if (categoryId === 'ids') {
      return record.file_path;
    } else if (['employment', 'charity', 'club', 'degrees', 'military', 'miscellaneous'].includes(categoryId)) {
      return record.file_paths?.length > 0 ? record.file_paths[0] : null;
    }
    return null;
  };

  const getDocumentName = (record) => {
    if (categoryId === 'religion') {
      return record[nameField] || record.religion_other || 'Unnamed Record';
    }
    if (categoryId === 'ids') {
      return record[nameField] || record.file_name || 'Unnamed Document';
    }
    const filePath = getFilePath(record);
    return record[nameField] || (filePath ? filePath.split('/').pop() : 'Unnamed Document');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderDocumentList = () => {
    if (!records.length) {
      return <p>No records found for {category?.label}.</p>;
    }

    return (
      <div className="personal-document-list">
        {records.map((record) => {
          const filePath = getFilePath(record);
          return (
            <div key={record.id} className="personal-document-item">
              <div className="personal-document-info">
                {categoryId !== 'religion' && (
                  <img
                    src={isImageFile(filePath) ? imageIcon : pdfIcon}
                    alt={isImageFile(filePath) ? 'Image Icon' : 'PDF Icon'}
                    className="personal-document-icon"
                  />
                )}
                <div className="personal-document-details">
                  <span className="personal-document-name">{getDocumentName(record)}</span>
                  <span className="personal-document-time">{formatDate(record.created_at)}</span>
                </div>
              </div>
              <div className="personal-document-actions">
                <button
                  className="personal-document-menu-button"
                  onClick={() => handleDropdownToggle(record.id)}
                >
                  ⋮
                </button>
                {dropdownOpenId === record.id && (
                  <ul className="personal-document-dropdown-menu">
                    <li
                      className="personal-document-dropdown-option"
                      onClick={() => handleView(record.id)}
                    >
                      View
                    </li>
                    <li
                      className="personal-document-dropdown-option"
                      onClick={() => handleEdit(record.id)}
                    >
                      Edit
                    </li>
                    <li
                      className="personal-document-dropdown-option"
                      onClick={() => handleDelete(record.id)}
                    >
                      Delete
                    </li>
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderViewDrawer = () => {
    if (!isViewDrawerOpen || !selectedRecord || categoryId !== 'ids') return null;

    const filePath = getFilePath(selectedRecord);

    const fields = [
      { label: 'Document Type', value: selectedRecord.document_type },
      { label: 'Document Number', value: selectedRecord.document_number },
      { label: 'Expiration Date', value: selectedRecord.expiration_date },
      { label: 'State Issued', value: selectedRecord.state_issued },
      { label: 'Country Issued', value: selectedRecord.country_issued },
      { label: 'Location', value: selectedRecord.location },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value);

    return (
      <>
        <div
          className="personal-info-drawer-backdrop"
          style={{ display: isViewDrawerOpen ? 'block' : 'none' }}
          onClick={handleCloseViewDrawer}
        ></div>
        <div className={`personal-info-drawer ${isViewDrawerOpen ? 'open' : ''}`}>
          <div className="personal-info-drawer-top">
            <button className="personal-info-drawer-close" onClick={handleCloseViewDrawer}>
              ×
            </button>
          </div>
          <div className="personal-info-drawer-divider"></div>
          <div className="personal-info-drawer-header">
            <h3 className="personal-info-drawer-heading">{selectedRecord.document_type || 'Document Details'}</h3>
            <div className="personal-info-drawer-actions">
              <button
                className="personal-info-drawer-action-button"
                onClick={() => handleEdit(selectedRecord.id)}
                title="Edit"
              >
                <img src={editIcon} alt="Edit Icon" className="personal-info-drawer-action-icon" />
              </button>
              <button
                className="personal-info-drawer-action-button"
                onClick={() => handleDelete(selectedRecord.id)}
                title="Delete"
              >
                <img src={deleteIcon} alt="Delete Icon" className="personal-info-drawer-action-icon" />
              </button>
            </div>
          </div>
          <div className="personal-info-drawer-content">
            {fields.map((field, index) => (
              <div key={index} className="personal-info-drawer-field">
                <label className="personal-info-drawer-label">{field.label}</label>
                <span className="personal-info-drawer-value">{field.value}</span>
              </div>
            ))}
            {filePath && (
              <div className="personal-info-drawer-field personal-info-drawer-file-field">
                <div className="personal-info-drawer-file">
                  <img
                    src={isImageFile(filePath) ? imageIcon : pdfIcon}
                    alt={isImageFile(filePath) ? 'Image Icon' : 'PDF Icon'}
                    className="personal-document-icon"
                  />
                  <a
                    href={`${import.meta.env.VITE_API_URL}${filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="personal-info-drawer-file-link"
                  >
                    {selectedRecord.file_name || filePath.split('/').pop()}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="personal-info-container">
      <ToastContainer />
      <div className="personal-info-header">
        <h2 className="personal-info-title">{category?.label || 'Details'}</h2>
        <button className="personal-add-button" onClick={handleAddButtonClick}>
          Add <span className="personal-add-button-arrow">▾</span>
        </button>
      </div>
      {renderDocumentList()}
      {renderViewDrawer()}
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

export default PersonalInfoDetails;
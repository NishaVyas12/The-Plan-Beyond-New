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
    if (categoryId === 'religion' && records.length > 0) {
      toast.info('You can only add one religion record.');
      return;
    }
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
    const newFiles = e.target.files;
    if (newFiles && newFiles.length > 0) {
      const existingFilesArray = Array.from(formData.files || []);
      const combinedFiles = [...existingFilesArray, ...Array.from(newFiles)];
      setFormData((prev) => ({ ...prev, files: combinedFiles }));
    }
  };

  const handleRemoveFile = (index, isExisting = false) => {
    if (isExisting) {
      const updatedExistingFiles = formData.existingFiles.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, existingFiles: updatedExistingFiles }));
    } else {
      const updatedFiles = Array.from(formData.files || []).filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, files: updatedFiles.length ? updatedFiles : null }));
    }
  };

  const handleSubmit = async (e, popupSpecificSubmit) => {
    e.preventDefault();
    if (popupSpecificSubmit) {
      const result = await popupSpecificSubmit(e, formData, handleCloseDrawer);
      if (result.success) {
        toast.success(result.message || 'Record saved successfully.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        handleCloseDrawer();
      } else {
        toast.error(result.message || 'Failed to save record.', {
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
    const record = records.find((r) => r.id === recordId);
    setSelectedRecord(record);
    setIsViewDrawerOpen(true);
    setDropdownOpenId(null);
  };

  const handleEdit = (recordId) => {
    const record = records.find((r) => r.id === recordId);
    if (record) {
      if (categoryId === 'ids') {
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
          existingFiles: Array.isArray(record.file_path)
            ? record.file_path.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'employment') {
        setFormData({
          ...formData,
          id: record.id,
          type: record.type || '',
          organisation: record.organisation || '',
          joiningDate: record.joining_date || '',
          leavingDate: record.leaving_date || '',
          supervisorContact: record.supervisor_contact || '',
          nomineeContact: record.nominee_contact || '',
          employmentType: record.employment_type || '',
          jobTitle: record.job_title || '',
          employmentId: record.employment_id || '',
          benefitsType: record.benefits_type || '',
          benefitsDetails: record.benefits_details || '',
          otherStatus: record.other_status || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_path)
            ? record.file_path.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'religion') {
        setFormData({
          ...formData,
          id: record.id,
          religion: record.religion || '',
          religion1: record.religion_other || '',
          nomineeContact: record.nominee_contact || '',
        });
      } else if (categoryId === 'charities') {
        setFormData({
          ...formData,
          id: record.id,
          charity_name: record.charity_name || '',
          charity_website: record.charity_website || '',
          payment_method: record.payment_method || '',
          amount: record.amount || '',
          frequency: record.frequency || '',
          enrolled: record.enrolled ? 'true' : 'false',
          nomineeContact: record.nominee_contact || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_paths)
            ? record.file_paths.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'clubs') {
        setFormData({
          ...formData,
          id: record.id,
          club: record.club || '',
          club_name: record.club_name || '',
          club_contact: record.club_contact || '',
          membership_type: record.membership_type || '',
          membership_status: record.membership_status ? 'true' : 'false',
          nomineeContact: record.nominee_contact || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_paths)
            ? record.file_paths.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'degrees') {
        setFormData({
          ...formData,
          id: record.id,
          university_name: record.university_name || '',
          degree: record.degree || '',
          degree_field: record.degree_field || '',
          degree_start: record.degree_start || '',
          degree_end: record.degree_end || '',
          grade: record.grade || '',
          activities: record.activities || '',
          degree_type: record.degree_type || '',
          completion_status: record.completion_status ? 'true' : 'false',
          nomineeContact: record.nominee_contact || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_paths)
            ? record.file_paths.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'military') {
        setFormData({
          ...formData,
          id: record.id,
          military_branch: record.military_branch || '',
          military_name: record.military_name || '',
          military_rank: record.military_rank || '',
          military_serve: record.military_serve || '',
          military_location: record.military_location || '',
          service_type: record.service_type || '',
          service_status: record.service_status ? 'true' : 'false',
          nomineeContact: record.nominee_contact || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_paths)
            ? record.file_paths.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      } else if (categoryId === 'miscellaneous') {
        setFormData({
          ...formData,
          id: record.id,
          item: record.item || '',
          description: record.description || '',
          category: record.category || '',
          status: record.status ? 'true' : 'false',
          nomineeContact: record.nominee_contact || '',
          notes: record.notes || '',
          files: null,
          existingFiles: Array.isArray(record.file_paths)
            ? record.file_paths.map((path) => ({ name: path.split('/').pop(), path }))
            : [],
        });
      }
      setIsDrawerOpen(true);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const [nomineeContacts, setNomineeContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  useEffect(() => {
  const fetchContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setAllContacts(data.contacts.map(contact => ({
          value: contact.name,
          label: contact.name,
        })));
      } else {
        toast.error('Failed to fetch contacts.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error('Error fetching contacts.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchNominees = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nominees`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setNomineeContacts(data.nominees.map(nominee => ({
          value: nominee.first_name,
          label: nominee.first_name,
        })));
      } else {
        toast.error('Failed to fetch nominees.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error('Error fetching nominees.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  fetchContacts();
  fetchNominees();
  if (endpoint) {
    fetchRecords();
  }
}, [endpoint]);

  // Update renderPopup to use the fetched nomineeContacts and allContacts
const renderPopup = () => {
  if (categoryId === 'ids') {
    return (
      <IdsPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, IdsPopup.handleSubmit)}
        documentTypes={documentTypes}
        uploadIcon={uploadIcon}
        handleCloseModal={handleCloseDrawer}
        nomineeContacts={nomineeContacts} // Updated to use state
      />
    );
  } else if (categoryId === 'employment') {
    return (
      <EmploymentPopup
      formData={formData}
      handleInputChange={handleInputChange}
      handleFileChange={handleFileChange}
      handleRemoveFile={handleRemoveFile}
      handleSubmit={(e) => handleSubmit(e, EmploymentPopup.handleSubmit)}
      nomineeContacts={nomineeContacts}
      allContacts={allContacts} // Add this line
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
        nomineeContacts={nomineeContacts} // Updated to use state
        handleSubmit={(e) => handleSubmit(e, ReligionPopup.handleSubmit)}
        categories={categories}
        handleCloseModal={handleCloseDrawer}
      />
    );
  } else if (categoryId === 'charities') {
    return (
      <CharitiesPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, CharitiesPopup.handleSubmit)}
        nomineeContacts={nomineeContacts} // Updated to use state
        handleCloseModal={handleCloseDrawer}
        categories={categories}
        uploadIcon={uploadIcon}
      />
    );
  } else if (categoryId === 'clubs') {
    return (
      <ClubsPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, ClubsPopup.handleSubmit)}
        allContacts={allContacts} // Updated to use state
        nomineeContacts={nomineeContacts} // Updated to use state
        handleCloseModal={handleCloseDrawer}
        categories={categories}
        uploadIcon={uploadIcon}
      />
    );
  } else if (categoryId === 'degrees') {
    return (
      <DegreesPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, DegreesPopup.handleSubmit)}
        nomineeContacts={nomineeContacts} // Updated to use state
        handleCloseModal={handleCloseDrawer}
        categories={categories}
        uploadIcon={uploadIcon}
      />
    );
  } else if (categoryId === 'military') {
    return (
      <MilitaryPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, MilitaryPopup.handleSubmit)}
        nomineeContacts={nomineeContacts} // Updated to use state
        handleCloseModal={handleCloseDrawer}
        categories={categories}
        uploadIcon={uploadIcon}
      />
    );
  } else if (categoryId === 'miscellaneous') {
    return (
      <MiscellaneousPopup
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={(e) => handleSubmit(e, MiscellaneousPopup.handleSubmit)}
        nomineeContacts={nomineeContacts} // Updated to use state
        handleCloseModal={handleCloseDrawer}
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
    if (Array.isArray(record.file_path)) return record.file_path;
    if (Array.isArray(record.file_paths)) return record.file_paths;
    return [];
  };

  const getDocumentName = (record) => {
    if (categoryId === 'religion') {
      return record[nameField] || record.religion_other || 'Unnamed Record';
    }
    if (categoryId === 'ids') {
      return record[nameField] || 'Unnamed Document';
    }
    if (categoryId === 'clubs') {
      return record.club_name || record.club || 'Unnamed Document';
    }
    if (categoryId === 'military') {
      return record.military_branch || record[nameField] || 'Unnamed Document';
    }
    if (categoryId === 'miscellaneous') {
      return record.item || 'Unnamed Document';
    }
    const filePaths = getFilePath(record);
    return record[nameField] || (filePaths.length > 0 ? `${filePaths.length} File(s)` : 'Unnamed Document');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const renderDocumentList = () => {
    if (!records.length) {
      return <p>No records found for {category?.label}.</p>;
    }

    return (
      <div className="personal-document-list">
        {records.map((record) => {
          const filePaths = getFilePath(record);
          return (
            <div
              key={record.id}
              className="personal-document-item"
              onClick={() => handleView(record.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="personal-document-info">
                {categoryId !== 'religion' && filePaths.length > 0 && (
                  <img
                    src={isImageFile(filePaths[0]) ? imageIcon : pdfIcon}
                    alt={isImageFile(filePaths[0]) ? 'Image Icon' : 'PDF Icon'}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownToggle(record.id);
                  }}
                >
                  ⋮
                </button>
                {dropdownOpenId === record.id && (
                  <ul className="personal-document-dropdown-menu">
                    <li
                      className="personal-document-dropdown-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(record.id);
                      }}
                    >
                      View
                    </li>
                    <li
                      className="personal-document-dropdown-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(record.id);
                      }}
                    >
                      Edit
                    </li>
                    <li
                      className="personal-document-dropdown-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(record.id);
                      }}
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
    if (!isViewDrawerOpen || !selectedRecord) return null;

    const filePaths = getFilePath(selectedRecord);

    const fields = categoryId === 'ids' ? [
      { label: 'Document Type', value: selectedRecord.document_type },
      { label: 'Document Number', value: selectedRecord.document_number },
      { label: 'Expiration Date', value: formatDisplayDate(selectedRecord.expiration_date) },
      { label: 'State Issued', value: selectedRecord.state_issued },
      { label: 'Country Issued', value: selectedRecord.country_issued },
      { label: 'Location', value: selectedRecord.location },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'employment' ? [
      { label: 'Employment Status', value: selectedRecord.type },
      { label: 'Organisation', value: selectedRecord.organisation },
      { label: 'Joining Date', value: formatDisplayDate(selectedRecord.joining_date) },
      { label: 'Leaving Date', value: formatDisplayDate(selectedRecord.leaving_date) },
      { label: 'Supervisor Contact', value: selectedRecord.supervisor_contact },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Employment Type', value: selectedRecord.employment_type },
      { label: 'Job Title', value: selectedRecord.job_title },
      { label: 'Employment ID', value: selectedRecord.employment_id },
      { label: 'Benefits Type', value: selectedRecord.benefits_type },
      { label: 'Benefits Details', value: selectedRecord.benefits_details },
      { label: 'Other Status', value: selectedRecord.other_status },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'religion' ? [
      { label: 'Religion', value: selectedRecord.religion },
      { label: 'Other Religion', value: selectedRecord.religion_other },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
    ].filter((field) => field.value) : categoryId === 'charities' ? [
      { label: 'Charity Name', value: selectedRecord.charity_name },
      { label: 'Website or Phone Number', value: selectedRecord.charity_website },
      { label: 'Payment Method', value: selectedRecord.payment_method },
      { label: 'Amount', value: selectedRecord.amount },
      { label: 'Payment Frequency', value: selectedRecord.frequency },
      { label: 'Enrolled in Auto-pay', value: selectedRecord.enrolled ? 'Yes' : 'No' },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'clubs' ? [
      { label: 'Organization', value: selectedRecord.club },
      { label: 'Club Name', value: selectedRecord.club_name },
      { label: 'Club Contact', value: selectedRecord.club_contact },
      { label: 'Membership Type', value: selectedRecord.membership_type },
      { label: 'Membership Status', value: selectedRecord.membership_status ? 'Active' : 'Inactive' },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'degrees' ? [
      { label: 'University Name', value: selectedRecord.university_name },
      { label: 'Degree', value: selectedRecord.degree },
      { label: 'Degree Field', value: selectedRecord.degree_field },
      { label: 'Degree Type', value: selectedRecord.degree_type },
      { label: 'Start Date', value: formatDisplayDate(selectedRecord.degree_start) },
      { label: 'End Date', value: formatDisplayDate(selectedRecord.degree_end) },
      { label: 'Grade', value: selectedRecord.grade },
      { label: 'Activities', value: selectedRecord.activities },
      { label: 'Completion Status', value: selectedRecord.completion_status ? 'Completed' : 'In Progress' },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'military' ? [
      { label: 'Military Branch', value: selectedRecord.military_branch },
      { label: 'Branch Name', value: selectedRecord.military_name },
      { label: 'Rank', value: selectedRecord.military_rank },
      { label: 'Service Type', value: selectedRecord.service_type },
      { label: 'Service Period', value: selectedRecord.military_serve },
      { label: 'Service Status', value: selectedRecord.service_status ? 'Retired' : 'Active' },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Location', value: selectedRecord.military_location },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : categoryId === 'miscellaneous' ? [
      { label: 'Item', value: selectedRecord.item },
      { label: 'Description', value: selectedRecord.description },
      { label: 'Category', value: selectedRecord.category },
      { label: 'Status', value: selectedRecord.status ? 'Active' : 'Inactive' },
      { label: 'Nominee Contact', value: selectedRecord.nominee_contact },
      { label: 'Notes', value: selectedRecord.notes },
    ].filter((field) => field.value) : [];

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
            <h3 className="personal-info-drawer-heading">
              {categoryId === 'ids' ? selectedRecord.document_type :
               categoryId === 'employment' ? selectedRecord.organisation || 'Document Details' :
               categoryId === 'religion' ? selectedRecord.religion || selectedRecord.religion_other || 'Religion Details' :
               categoryId === 'charities' ? selectedRecord.charity_name || 'Charity Details' :
               categoryId === 'clubs' ? (selectedRecord.club_name || selectedRecord.club || 'Club Details') :
               categoryId === 'degrees' ? selectedRecord.degree || 'Degree Details' :
               categoryId === 'military' ? (selectedRecord.military_name || selectedRecord.military_branch || 'Military Details') :
               categoryId === 'miscellaneous' ? selectedRecord.item || 'Miscellaneous Details' :
               'Document Details'}
            </h3>
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
            {filePaths.length > 0 && (
              <div className="personal-info-drawer-field personal-info-drawer-file-field">
               
                <div className="personal-info-drawer-file-list">
                  {filePaths.map((filePath, index) => (
                    <div key={index} className="personal-info-drawer-file">
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
                        {filePath.split('/').pop()}
                      </a>
                    </div>
                  ))}
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
        <button
          className="personal-add-button"
          onClick={handleAddButtonClick}
          disabled={categoryId === 'religion' && records.length > 0}
        >
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
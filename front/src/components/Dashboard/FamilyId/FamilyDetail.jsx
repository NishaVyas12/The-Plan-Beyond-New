import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FamilyDetail.css';
import UploadIcon from '../../../assets/images/dash_icon/upload.svg';
import ImageIcon from '../../../assets/images/dash_icon/image.svg';
import PdfIcon from '../../../assets/images/dash_icon/pdf.svg';
import CrossIcon from '../../../assets/images/dash_icon/trash.svg';

const FamilyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    driver_license_document: null,
    driver_license_number: '',
    driverLicenseStateIssued: '',
    driver_license_expiration: '',
    aadhaar_card_document: null,
    aadhaarNumber: '',
    pan_card_document: null,
    panNumber: '',
    birth_certificate_document: null,
    passport_document: null,
    passport_number: '',
    passportStateIssued: '',
    passportExpiration: '',
    notes: '',
    relation: '',
    profile_image: '',
    emergencyContact: false,
    otherDocuments: [],
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [tempInputData, setTempInputData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [scrollToId, setScrollToId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [pendingEmergencyValue, setPendingEmergencyValue] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editMode, setEditMode] = useState({});
  const cardRefs = useRef({});

  const handleSaveAll = async () => {
    const payload = {
      driver_license_number: tempInputData.driver_license_number || formData.driver_license_number,
      driver_license_state_issued: tempInputData.driverLicenseStateIssued || formData.driverLicenseStateIssued,
      driver_license_expiration: tempInputData.driver_license_expiration
        ? tempInputData.driver_license_expiration.split("T")[0]
        : formData.driver_license_expiration,
      aadhaar_number: tempInputData.aadhaarNumber || formData.aadhaarNumber,
      pan_number: tempInputData.panNumber || formData.panNumber,
      passport_number: tempInputData.passport_number || formData.passport_number,
      passport_state_issued: tempInputData.passportStateIssued || formData.passportStateIssued,
      passport_expiration: tempInputData.passportExpiration
        ? tempInputData.passportExpiration.split("T")[0]
        : formData.passportExpiration,
      notes: tempInputData.notes || formData.notes,
      emergency_contact: tempInputData.emergencyContact || formData.emergencyContact, // Added
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Family member updated successfully!", { position: 'top-right', autoClose: 3000 });
        setFormData((prev) => ({
          ...prev,
          ...payload,
        }));
        setInitialFormData((prev) => ({
          ...prev,
          ...payload,
        }));
        setTempInputData({});
      } else {
        handleApiError(response, data, "Failed to update family member.");
      }
    } catch (err) {
      handleNetworkError(err, "Error updating family member.");
    }
  };

  const handleSaveCard = async (fieldName, docIndex = null) => {
    if (docIndex !== null) {
      // Existing logic for other documents (unchanged)
      const updatedOtherDocs = [...formData.otherDocuments];
      const doc = updatedOtherDocs[docIndex];
      const tempDoc = tempInputData[`other_document_${docIndex}`] || {};
      const payload = {
        family_id: id,
        other_document_name: tempDoc.other_document_name || doc.other_document_name || `Other Document ${Date.now()}`,
        other_document_number: tempDoc.other_document_number || doc.other_document_number || '',
        other_document_issued: tempDoc.other_document_issued
          ? tempDoc.other_document_issued.split("T")[0]
          : doc.other_document_issued || '',
        other_document_expiration: tempDoc.other_document_expiration
          ? tempDoc.other_document_expiration.split("T")[0]
          : doc.other_document_expiration || '',
      };

      const formDataToSend = new FormData();
      formDataToSend.append('family_id', id);
      formDataToSend.append('other_document_name', payload.other_document_name);
      formDataToSend.append('other_document_number', payload.other_document_number);
      formDataToSend.append('other_document_issued', payload.other_document_issued);
      formDataToSend.append('other_document_expiration', payload.other_document_expiration);
      if (doc.other_file && typeof doc.other_file === 'object') {
        formDataToSend.append('other_file', doc.other_file);
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/other-document`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();
        if (data.success && data.updatedDocument) {
          toast.success(`'${payload.other_document_name}' updated.`, {
            position: 'top-right',
            autoClose: 3000,
          });
          updatedOtherDocs[docIndex] = {
            ...doc,
            id: data.updatedDocument.id,
            other_document_name: data.updatedDocument.document_name,
            other_document_number: data.updatedDocument.number,
            other_document_issued: data.updatedDocument.issued_date,
            other_document_expiration: data.updatedDocument.expiration_date,
            other_file: data.updatedDocument.file || doc.other_file,
          };
          setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
          setInitialFormData((prev) => ({
            ...prev,
            otherDocuments: prev.otherDocuments.map((d, i) =>
              i === docIndex ? { ...updatedOtherDocs[docIndex] } : d
            ),
          }));
          setTempInputData((prev) => {
            const newTemp = { ...prev };
            delete newTemp[`other_document_${docIndex}`];
            return newTemp;
          });
          setEditMode((prev) => ({ ...prev, [`other_document_${docIndex}`]: false }));
        } else {
          handleApiError(response, data, `Failed to update '${payload.other_document_name}'.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error updating '${payload.other_document_name}'.`);
      }
    } else if (fieldName === 'notes') {
      await handleSaveAll();
      setEditMode((prev) => ({ ...prev, notes: false }));
      setTempInputData((prev) => {
        const newTemp = { ...prev };
        delete newTemp.notes;
        return newTemp;
      });
    } else if (fieldName === 'birthday') {
      const payload = {
        birthday: tempInputData.birthday
          ? tempInputData.birthday.split("T")[0]
          : formData.birthday || '',
      };

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Birthday updated successfully.', { position: 'top-right', autoClose: 3000 });
          setFormData((prev) => ({
            ...prev,
            birthday: payload.birthday,
          }));
          setInitialFormData((prev) => ({
            ...prev,
            birthday: payload.birthday,
          }));
          setTempInputData((prev) => {
            const newTemp = { ...prev };
            delete newTemp.birthday;
            return newTemp;
          });
          setEditMode((prev) => ({ ...prev, birthday: false }));
        } else {
          handleApiError(response, data, 'Failed to update birthday.');
        }
      } catch (err) {
        handleNetworkError(err, 'Error updating birthday.');
      }
    } else {
      const cardFields = {
        driver_license_document: {
          driver_license_number: tempInputData.driver_license_number || formData.driver_license_number,
          driver_license_state_issued: tempInputData.driverLicenseStateIssued || formData.driverLicenseStateIssued,
          driver_license_expiration: tempInputData.driver_license_expiration
            ? tempInputData.driver_license_expiration.split("T")[0]
            : formData.driver_license_expiration,
        },
        passport_document: {
          passport_number: tempInputData.passport_number || formData.passport_number,
          passport_state_issued: tempInputData.passportStateIssued || formData.passportStateIssued,
          passport_expiration: tempInputData.passportExpiration
            ? tempInputData.passportExpiration.split("T")[0]
            : formData.passportExpiration,
        },
        aadhaar_card_document: { aadhaar_number: tempInputData.aadhaarNumber || formData.aadhaarNumber },
        pan_card_document: { pan_number: tempInputData.panNumber || formData.panNumber },
      };

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      Object.entries(cardFields[fieldName] || {}).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      if (formData[fieldName] && typeof formData[fieldName] === 'object') {
        formDataToSend.append(fieldName, formData[fieldName]);
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`${fieldName} updated successfully.`, { position: 'top-right', autoClose: 3000 });
          setFormData((prev) => ({
            ...prev,
            ...cardFields[fieldName],
            [fieldName]: data.familyMember[fieldName] || formData[fieldName],
          }));
          setInitialFormData((prev) => ({
            ...prev,
            ...cardFields[fieldName],
            [fieldName]: data.familyMember[fieldName] || formData[fieldName],
          }));
          setTempInputData((prev) => {
            const newTemp = { ...prev };
            Object.keys(cardFields[fieldName] || {}).forEach((key) => delete newTemp[key]);
            return newTemp;
          });
          setEditMode((prev) => ({ ...prev, [fieldName]: false }));
        } else {
          handleApiError(response, data, `Failed to update ${fieldName}.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error updating ${fieldName}.`);
      }
    }
  };



  const handleCancelCard = (fieldName, docIndex = null) => {
    if (docIndex !== null) {
      setTempInputData((prev) => {
        const newTemp = { ...prev };
        delete newTemp[`other_document_${docIndex}`];
        return newTemp;
      });
      const updatedOtherDocs = [...formData.otherDocuments];
      if (updatedOtherDocs[docIndex].other_file && typeof updatedOtherDocs[docIndex].other_file === 'object') {
        updatedOtherDocs[docIndex].other_file = initialFormData.otherDocuments[docIndex]?.other_file || null;
        setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
      }
      setEditMode((prev) => ({ ...prev, [`other_document_${docIndex}`]: false }));
    } else {
      const cardFields = {
        driver_license_document: ['driver_license_number', 'driverLicenseStateIssued', 'driver_license_expiration'],
        passport_document: ['passport_number', 'passportStateIssued', 'passportExpiration'],
        aadhaar_card_document: ['aadhaarNumber'],
        pan_card_document: ['panNumber'],
        notes: ['notes'],
        birthday: ['birthday'],
      };
      setTempInputData((prev) => {
        const newTemp = { ...prev };
        (cardFields[fieldName] || []).forEach((key) => delete newTemp[key]);
        return newTemp;
      });
      if (formData[fieldName] && typeof formData[fieldName] === 'object') {
        setFormData((prev) => ({ ...prev, [fieldName]: initialFormData[fieldName] || null }));
      } else if (fieldName === 'birthday') {
        setFormData((prev) => ({ ...prev, birthday: initialFormData.birthday || '' }));
      }
      setEditMode((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  useEffect(() => {
    if (scrollToId && cardRefs.current[scrollToId]) {
      const element = cardRefs.current[scrollToId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const offsetTop = element.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    }
  }, [scrollToId]);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'dd/mm/yyyy';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'dd/mm/yyyy';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error('Error formatting date for display:', e);
      return 'dd/mm/yyyy';
    }
  };

  useEffect(() => {
    const fetchFamilyMember = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          const fetchedOtherDocs = Array.isArray(data.familyMember.other_documents)
            ? data.familyMember.other_documents.map((doc) => ({
              id: doc.id || `other-${Date.now()}-${Math.random()}`,
              other_document_name: doc.document_name || '',
              other_document_number: doc.number || '',
              other_document_issued: doc.issued_date || '',
              other_document_expiration: doc.expiration_date || '',
              other_file: doc.file || null,
            }))
            : [];

          const fetchedData = {
            firstName: data.familyMember.first_name || '',
            lastName: data.familyMember.last_name || '',
            birthday: data.familyMember.birthday || '',
            driver_license_document: data.familyMember.driver_license_document || null,
            driver_license_number: data.familyMember.driver_license_number || '',
            driverLicenseStateIssued: data.familyMember.driver_license_state_issued || '',
            driver_license_expiration: data.familyMember.driver_license_expiration || '',
            aadhaar_card_document: data.familyMember.aadhaar_card_document || null,
            aadhaarNumber: data.familyMember.aadhaar_number || '',
            pan_card_document: data.familyMember.pan_card_document || null,
            panNumber: data.familyMember.pan_number || '',
            birth_certificate_document: data.familyMember.birth_certificate_document || null,
            passport_document: data.familyMember.passport_document || null,
            passport_number: data.familyMember.passport_number || '',
            passportStateIssued: data.familyMember.passport_state_issued || '',
            passportExpiration: data.familyMember.passport_expiration || '',
            notes: data.familyMember.notes || '',
            relation: data.familyMember.relation || '',
            profile_image: data.familyMember.profile_image || '',
            emergencyContact: data.familyMember.emergency_contact || false, // Added
            otherDocuments: fetchedOtherDocs,
          };
          setFormData(fetchedData);
          setInitialFormData(fetchedData);
        } else {
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.', {
              position: 'top-right',
              autoClose: 3000,
              onClose: () => navigate('/login'),
            });
          } else {
            toast.error(data.message || 'Failed to fetch family member details.', {
              position: 'top-right',
              autoClose: 3000,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching family member details:', err);
        toast.error('Error fetching family member details. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFamilyMember();
  }, [id, navigate]);

  const handleFileChange = async (e, docIndex = null) => {
    const { name, files } = e.target;
    const file = files[0];

    if (!file) return;

    if (docIndex !== null) {
      const updatedOtherDocs = [...formData.otherDocuments];
      updatedOtherDocs[docIndex] = {
        ...updatedOtherDocs[docIndex],
        other_file: file,
      };
      setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: file }));
    }
  };

  const handleDeleteFile = async (fieldName, docIndex = null) => {
    if (docIndex !== null) {
      const updatedOtherDocs = [...formData.otherDocuments];
      updatedOtherDocs[docIndex].other_file = null;

      const payload = {
        other_document_name: updatedOtherDocs[docIndex].other_document_name,
        other_document_number: updatedOtherDocs[docIndex].other_document_number || '',
        other_document_issued: updatedOtherDocs[docIndex].other_document_issued || '',
        other_document_expiration: updatedOtherDocs[docIndex].other_document_expiration || '',
        other_document_index: docIndex,
        file_path: '',
      };

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`${updatedOtherDocs[docIndex].other_document_name} file deleted.`, {
            position: 'top-right',
            autoClose: 3000,
          });
          setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
          setInitialFormData((prev) => ({
            ...prev,
            otherDocuments: prev.otherDocuments.map((d, i) =>
              i === docIndex ? { ...updatedOtherDocs[docIndex] } : d
            ),
          }));
        } else {
          handleApiError(response, data, `Failed to delete ${updatedOtherDocs[docIndex].other_document_name} file.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error deleting ${updatedOtherDocs[docIndex].other_document_name} file.`);
      }
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: null }));

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      formDataToSend.append(fieldName, '');

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();

        if (data.success) {
          toast.success(`${fieldName} deleted successfully.`, {
            position: 'top-right',
            autoClose: 3000,
          });
          setInitialFormData((prev) => ({ ...prev, [fieldName]: null }));
        } else {
          handleApiError(response, data, `Failed to delete ${fieldName}.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error deleting ${fieldName}.`);
      }
    }
  };

  const handleInputChange = (e, docIndex = null) => {
    const { name, value } = e.target;

    if (docIndex !== null) {
      setTempInputData((prev) => ({
        ...prev,
        [`other_document_${docIndex}`]: {
          ...prev[`other_document_${docIndex}`],
          [name]: value,
        },
      }));
    } else {
      setTempInputData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleApiError = (response, data, defaultMessage) => {
    if (response.status === 401) {
      toast.error('Session expired. Please log in again.', {
        position: 'top-right',
        autoClose: 3000,
        onClose: () => navigate('/login'),
      });
    } else {
      toast.error(data.message || defaultMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleNetworkError = (err, defaultMessage) => {
    console.error(defaultMessage, err);
    toast.error(defaultMessage + ' Please try again.', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const getDaysUntilBirthday = (birthdayString) => {
    if (!birthdayString) return '-';
    const today = new Date();
    const birthDate = new Date(birthdayString);

    if (isNaN(birthDate.getTime())) {
      return '-';
    }

    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = Math.abs(nextBirthday - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `${diffDays} days remaining`;
  };

  const handleAddButtonClick = () => {
    setShowAddDropdown(!showAddDropdown);
    setOpenDropdownId(null); // Close any open card dropdown
  };

  const toggleOptionsDropdown = (cardId) => {
    setOpenDropdownId(openDropdownId === cardId ? null : cardId);
    setShowAddDropdown(false); // Close Add dropdown if open
  };


  const handleEditCard = (fieldName, docIndex = null) => {
    setEditMode((prev) => ({
      ...prev,
      [docIndex !== null ? `other_document_${docIndex}` : fieldName]: true,
    }));
    setOpenDropdownId(null);
  };

  const handleDeleteCard = async (fieldName, docIndex = null) => {
    setOpenDropdownId(null);
    if (docIndex !== null) {
      const updatedOtherDocs = [...formData.otherDocuments];
      const doc = updatedOtherDocs[docIndex];
      const payload = {
        other_document_index: docIndex,
        other_document_name: null,
        other_document_number: null,
        other_document_issued: null,
        other_document_expiration: null,
        file_path: null,
      };

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success) {
          updatedOtherDocs.splice(docIndex, 1);
          setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
          setInitialFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
          setTempInputData((prev) => {
            const newTemp = { ...prev };
            delete newTemp[`other_document_${docIndex}`];
            return newTemp;
          });
          setEditMode((prev) => {
            const newEditMode = { ...prev };
            delete newEditMode[`other_document_${docIndex}`];
            return newEditMode;
          });
          toast.success('Other document deleted successfully.', { position: 'top-right', autoClose: 3000 });
        } else {
          handleApiError(response, data, 'Failed to delete other document.');
        }
      } catch (err) {
        handleNetworkError(err, 'Error deleting other document.');
      }
    } else {
      const cardFields = {
        driver_license_document: {
          driver_license_number: '',
          driver_license_state_issued: '',
          driver_license_expiration: '',
          driver_license_document: '', // Changed to empty string to trigger file deletion
        },
        passport_document: {
          passport_number: '',
          passport_state_issued: '',
          passport_expiration: '',
          passport_document: '', // Changed to empty string to trigger file deletion
        },
        aadhaar_card_document: {
          aadhaar_number: '',
          aadhaar_card_document: '', // Changed to empty string to trigger file deletion
        },
        pan_card_document: {
          pan_number: '',
          pan_card_document: '', // Changed to empty string to trigger file deletion
        },
        birth_certificate_document: {
          birth_certificate_document: '', // Changed to empty string to trigger file deletion
        },
        notes: { notes: '' },
        birthday: { birthday: '' },
      };

      const payload = cardFields[fieldName] || {};
      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      Object.entries(payload).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
          method: 'PUT',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();
        if (data.success) {
          setFormData((prev) => ({
            ...prev,
            ...cardFields[fieldName],
            [fieldName]: null, // Ensure file field is set to null in state
          }));
          setInitialFormData((prev) => ({
            ...prev,
            ...cardFields[fieldName],
            [fieldName]: null, // Ensure file field is set to null in state
          }));
          setTempInputData((prev) => {
            const newTemp = { ...prev };
            Object.keys(cardFields[fieldName]).forEach((key) => delete newTemp[key]);
            return newTemp;
          });
          setEditMode((prev) => ({ ...prev, [fieldName]: false }));
          toast.success(`${fieldName} deleted successfully.`, { position: 'top-right', autoClose: 3000 });
        } else {
          handleApiError(response, data, `Failed to delete ${fieldName}.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error deleting ${fieldName}.`);
      }
    }
  };


  const handleAddOptionClick = (option) => {
    setShowAddDropdown(false);

    const cardMapping = {
      'Driver License': 'driver_license_document',
      'Pan Card': 'pan_card_document',
      'Aadhaar Card': 'aadhaar_card_document',
      'Passport': 'passport_document',
      'Birth Certificate': 'birth_certificate_document',
      'Birthday': 'birthdayCard',
    };

    if (option === 'Other') {
      const newOtherDoc = {
        id: `other-${Date.now()}-${Math.random()}`,
        other_document_name: '',
        other_document_number: '',
        other_document_issued: '',
        other_document_expiration: '',
        other_file: null,
      };
      setFormData((prev) => ({
        ...prev,
        otherDocuments: [...prev.otherDocuments, newOtherDoc],
      }));
      setInitialFormData((prev) => ({
        ...prev,
        otherDocuments: [...(prev.otherDocuments || []), newOtherDoc],
      }));
      setScrollToId(newOtherDoc.id);
    } else {
      const targetId = cardMapping[option];
      if (targetId) {
        setScrollToId(targetId);
      } else {
        toast.info(`Card for '${option}' is not available.`, {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    }
  };

  const handlePreview = (file) => {
    if (file) {
      setPreviewFile(file);
      setShowPreview(true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  const getFileIcon = (file) => {
    if (!file) return null;
    const fileName = typeof file === 'object' ? file.name : file;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
    return isImage ? ImageIcon : PdfIcon;
  };

  const isCardFilled = (fieldName, doc = null) => {
    if (doc) {
      return (
        doc.other_document_name ||
        doc.other_document_number ||
        doc.other_document_issued ||
        doc.other_document_expiration
      );
    }
    switch (fieldName) {
      case 'driver_license_document':
        return (
          formData.driver_license_number ||
          formData.driverLicenseStateIssued ||
          formData.driver_license_expiration
        );
      case 'passport_document':
        return (
          formData.passport_number ||
          formData.passportStateIssued ||
          formData.passportExpiration
        );
      case 'aadhaar_card_document':
        return formData.aadhaarNumber;
      case 'pan_card_document':
        return formData.panNumber;
      case 'birth_certificate_document':
        return false; // Birth Certificate only has file upload, no inputs to consider filled
      case 'notes':
        return formData.notes;
      case 'birthday':
        return formData.birthday;
      default:
        return false;
    }
  };
  const renderBirthdayCard = () => {
    const isFilled = isCardFilled('birthday');
    const showButtons = shouldShowButtons('birthday') || editMode.birthday;

    return (
      <div
        id="card-birthday"
        className="family-detail-card birthday-card"
        ref={(el) => {
          cardRefs.current['birthdayCard'] = el;
          console.log('Ref assigned for birthdayCard:', el);
        }}
      >
        <div className="family-detail-card-header">
          <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
            Birthday
          </label>
          <span
            className="family-detail-card-options"
            onClick={() => toggleOptionsDropdown('birthday')}
          >
            ...
          </span>
          {openDropdownId === 'birthday' && (
            <div className="family-detail-card-options-dropdown">
              <div onClick={() => handleEditCard('birthday')}>Edit</div>
              <div onClick={() => handleDeleteCard('birthday')}>Delete</div>
            </div>
          )}
        </div>
        {(isFilled && !editMode.birthday) ? (
          <div className="birthday-content">
            <div className="birthday-date-row">
              <span className="birthday-date-display">
                {formatDisplayDate(formData.birthday)}
              </span>
              <span className="remaining-days">{getDaysUntilBirthday(formData.birthday)}</span>
            </div>
          </div>
        ) : (
          <div className="family-detail-input-group family-detail-single-column">
            <label htmlFor="birthday" className="family-detail-label">Birthday:</label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={
                tempInputData.birthday
                  ? tempInputData.birthday.split("T")[0]
                  : formData.birthday
                    ? formData.birthday.split("T")[0]
                    : ''
              }
              onChange={handleInputChange}
              className="family-detail-text-input"
            />
          </div>
        )}
        {showButtons && (
          <div className="family-detail-button-group">
            <button
              type="button"
              className="family-detail-save-button"
              onClick={() => handleSaveCard('birthday')}
            >
              Save
            </button>
            <button
              type="button"
              className="family-detail-cancel-button"
              onClick={() => handleCancelCard('birthday')}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const shouldShowButtons = (fieldName, docIndex = null) => {
    if (docIndex !== null) {
      const tempDoc = tempInputData[`other_document_${docIndex}`];
      const doc = formData.otherDocuments[docIndex];
      return (
        !isCardFilled(null, doc) ||
        (tempDoc && Object.keys(tempDoc).length > 0) ||
        (doc.other_file && typeof doc.other_file === 'object') ||
        editMode[`other_document_${docIndex}`]
      );
    }
    const cardFields = {
      driver_license_document: ['driver_license_number', 'driverLicenseStateIssued', 'driver_license_expiration'],
      passport_document: ['passport_number', 'passportStateIssued', 'passportExpiration'],
      aadhaar_card_document: ['aadhaarNumber'],
      pan_card_document: ['panNumber'],
      notes: ['notes'],
      birthday: ['birthday'],
    };
    return (
      !isCardFilled(fieldName) ||
      (cardFields[fieldName]?.some((key) => tempInputData[key] !== undefined)) ||
      (formData[fieldName] && typeof formData[fieldName] === 'object') ||
      editMode[fieldName]
    );
  };


  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setPendingEmergencyValue(checked);
    setShowEmergencyPopup(true);
  };


  const handleConfirmEmergency = async () => {
    setFormData((prev) => ({ ...prev, emergencyContact: pendingEmergencyValue }));
    setTempInputData((prev) => ({ ...prev, emergencyContact: pendingEmergencyValue }));
    setShowEmergencyPopup(false);

    // Save the emergency contact change
    try {
      const payload = {
        emergency_contact: pendingEmergencyValue,
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Emergency contact updated successfully!", { position: 'top-right', autoClose: 3000 });
        setInitialFormData((prev) => ({ ...prev, emergencyContact: pendingEmergencyValue }));
      } else {
        handleApiError(response, data, "Failed to update emergency contact.");
        // Revert on failure
        setFormData((prev) => ({ ...prev, emergencyContact: prev.emergencyContact }));
        setTempInputData((prev) => ({ ...prev, emergencyContact: prev.emergencyContact }));
      }
    } catch (err) {
      handleNetworkError(err, "Error updating emergency contact.");
      // Revert on failure
      setFormData((prev) => ({ ...prev, emergencyContact: prev.emergencyContact }));
      setTempInputData((prev) => ({ ...prev, emergencyContact: prev.emergencyContact }));
    }
  };

  const handleCancelEmergency = () => {
    setShowEmergencyPopup(false);
    setPendingEmergencyValue(null);
  };


  const renderDocumentCard = (fieldName, label) => {
    const isFilled = isCardFilled(fieldName);
    const showButtons = shouldShowButtons(fieldName) || editMode[fieldName];

    return (
      <div
        id={`card-${fieldName}`}
        className="family-detail-card"
        ref={(el) => {
          cardRefs.current[fieldName] = el;
          console.log(`Ref assigned for ${fieldName}:`, el);
        }}
      >
        <div className="family-detail-card-header">
          <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
            {label}
          </label>
          <span
            className="family-detail-card-options"
            onClick={() => toggleOptionsDropdown(fieldName)}
          >
            ...
          </span>
          {openDropdownId === fieldName && (
            <div className="family-detail-card-options-dropdown">
              <div onClick={() => handleEditCard(fieldName)}>Edit</div>
              <div onClick={() => handleDeleteCard(fieldName)}>Delete</div>
            </div>
          )}
        </div>
        {/* File Upload Section */}
        {formData[fieldName] ? (
          <div className="family-detail-file-container">
            <img
              src={getFileIcon(formData[fieldName])}
              alt={`${label} Icon`}
              className="family-detail-file-icon"
            />
            <span
              className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
              onClick={() => handlePreview(formData[fieldName])}
            >
              {typeof formData[fieldName] === 'object' ? formData[fieldName].name : formData[fieldName].split('/').pop()}
            </span>
            <img
              src={CrossIcon}
              alt="Delete Icon"
              className="family-detail-delete-icon"
              onClick={() => handleDeleteFile(fieldName)}
            />
          </div>
        ) : (
          <div className="family-detail-card-upload">
            <img src={UploadIcon} alt="Upload Icon" className="family-upload-icon" />
            <div className="upload-text-group">
              <p>Drag and drop files here</p>
              <p>OR</p>
              <p>Browse files</p>
            </div>
            <input
              type="file"
              name={fieldName}
              className="family-detail-card-input"
              onChange={handleFileChange}
            />
          </div>
        )}
        {/* Input Fields Section */}
        {fieldName === 'driver_license_document' && (
          (isFilled && !editMode[fieldName]) ? (
            <>
              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                    Number:
                  </label>
                  <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                    {formData.driver_license_number || 'N/A'}
                  </span>
                </div>
                <div className="family-detail-input-group">
                  <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                    State Issued:
                  </label>
                  <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                    {formData.driverLicenseStateIssued || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="family-detail-input-group family-detail-single-column">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Expiration Date:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {formData.driver_license_expiration ? formatDisplayDate(formData.driver_license_expiration) : 'N/A'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label htmlFor="driver_license_number" className="family-detail-label">Number:</label>
                  <input
                    type="text"
                    id="driver_license_number"
                    name="driver_license_number"
                    value={tempInputData.driver_license_number || formData.driver_license_number}
                    onChange={handleInputChange}
                    className="family-detail-text-input"
                  />
                </div>
                <div className="family-detail-input-group">
                  <label htmlFor="driverLicenseStateIssued" className="family-detail-label">State Issued:</label>
                  <input
                    type="text"
                    id="driverLicenseStateIssued"
                    name="driverLicenseStateIssued"
                    value={tempInputData.driverLicenseStateIssued || formData.driverLicenseStateIssued}
                    onChange={handleInputChange}
                    className="family-detail-text-input"
                  />
                </div>
              </div>
              <div className="family-detail-input-group family-detail-single-column">
                <label htmlFor="driver_license_expiration" className="family-detail-label">Expiration Date:</label>
                <input
                  type="date"
                  id="driver_license_expiration"
                  name="driver_license_expiration"
                  value={
                    tempInputData.driver_license_expiration
                      ? tempInputData.driver_license_expiration.split("T")[0]
                      : formData.driver_license_expiration
                        ? formData.driver_license_expiration.split("T")[0]
                        : ''
                  }
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </>
          )
        )}
        {fieldName === 'passport_document' && (
          (isFilled && !editMode[fieldName]) ? (
            <>
              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                    Number:
                  </label>
                  <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                    {formData.passport_number || 'N/A'}
                  </span>
                </div>
                <div className="family-detail-input-group">
                  <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                    State Issued:
                  </label>
                  <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                    {formData.passportStateIssued || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="family-detail-input-group family-detail-single-column">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Expiration Date:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {formData.passportExpiration ? formatDisplayDate(formData.passportExpiration) : 'N/A'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label htmlFor="passport_number" className="family-detail-label">Number:</label>
                  <input
                    type="text"
                    id="passport_number"
                    name="passport_number"
                    value={tempInputData.passport_number || formData.passport_number}
                    onChange={handleInputChange}
                    className="family-detail-text-input"
                  />
                </div>
                <div className="family-detail-input-group">
                  <label htmlFor="passportStateIssued" className="family-detail-label">State Issued:</label>
                  <input
                    type="text"
                    id="passportStateIssued"
                    name="passportStateIssued"
                    value={tempInputData.passportStateIssued || formData.passportStateIssued}
                    onChange={handleInputChange}
                    className="family-detail-text-input"
                  />
                </div>
              </div>
              <div className="family-detail-input-group family-detail-single-column">
                <label htmlFor="passportExpiration" className="family-detail-label">Expiration Date:</label>
                <input
                  type="date"
                  id="passportExpiration"
                  name="passportExpiration"
                  value={
                    tempInputData.passportExpiration
                      ? tempInputData.passportExpiration.split("T")[0]
                      : formData.passportExpiration
                        ? formData.passportExpiration.split("T")[0]
                        : ''
                  }
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </>
          )
        )}
        {fieldName === 'aadhaar_card_document' && (
          (isFilled && !editMode[fieldName]) ? (
            <div className="family-detail-input-group">
              <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                Number:
              </label>
              <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                {formData.aadhaarNumber || 'N/A'}
              </span>
            </div>
          ) : (
            <div className="family-detail-input-group">
              <label htmlFor="aadhaarNumber" className="family-detail-label">Number:</label>
              <input
                type="text"
                id="aadhaarNumber"
                name="aadhaarNumber"
                value={tempInputData.aadhaarNumber || formData.aadhaarNumber}
                onChange={handleInputChange}
                className="family-detail-text-input"
              />
            </div>
          )
        )}
        {fieldName === 'pan_card_document' && (
          (isFilled && !editMode[fieldName]) ? (
            <div className="family-detail-input-group">
              <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                Number:
              </label>
              <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                {formData.panNumber || 'N/A'}
              </span>
            </div>
          ) : (
            <div className="family-detail-input-group">
              <label htmlFor="panNumber" className="family-detail-label">Number:</label>
              <input
                type="text"
                id="panNumber"
                name="panNumber"
                value={tempInputData.panNumber || formData.panNumber}
                onChange={handleInputChange}
                className="family-detail-text-input"
              />
            </div>
          )
        )}
        {fieldName === 'birth_certificate_document' && (
          <div className="family-detail-input-group">
            {/* Birth Certificate has no input fields */}
          </div>
        )}
        {fieldName !== 'birth_certificate_document' && showButtons && (
          <div className="family-detail-button-group">
            <button
              type="button"
              className="family-detail-save-button"
              onClick={() => handleSaveCard(fieldName)}
            >
              Save
            </button>
            <button
              type="button"
              className="family-detail-cancel-button"
              onClick={() => handleCancelCard(fieldName)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderOtherDocumentCard = (doc, index) => {
    const isFilled = isCardFilled(null, doc);
    const tempDoc = tempInputData[`other_document_${index}`] || {};
    const showButtons = shouldShowButtons(null, index) || editMode[`other_document_${index}`];

    return (
      <div
        key={doc.id}
        id={`card-${doc.id}`}
        className="family-detail-card other-document-card"
        ref={(el) => {
          cardRefs.current[doc.id] = el;
          console.log(`Ref assigned for other document: ${doc.id}`, el);
        }}
      >
        <div className="family-detail-card-header">
          <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
            Other Document
          </label>
          <span
            className="family-detail-card-options"
            onClick={() => toggleOptionsDropdown(doc.id)}
          >
            ...
          </span>
          {openDropdownId === doc.id && (
            <div className="family-detail-card-options-dropdown">
              <div onClick={() => handleEditCard('other_document', index)}>Edit</div>
              <div onClick={() => handleDeleteCard('other_document', index)}>Delete</div>
            </div>
          )}
        </div>
        {/* File Upload Section */}
        {doc.other_file ? (
          <div className="family-detail-file-container">
            <img
              src={getFileIcon(doc.other_file)}
              alt="File Icon"
              className="family-detail-file-icon"
            />
            <span
              className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
              onClick={() => handlePreview(doc.other_file)}
            >
              Uploaded: {typeof doc.other_file === 'object' ? doc.other_file.name : doc.other_file.split('/').pop()}
            </span>
            <img
              src={CrossIcon}
              alt="Delete Icon"
              className="family-detail-delete-icon"
              onClick={() => handleDeleteFile('other_file', index)}
            />
          </div>
        ) : (
          <div className="family-detail-card-upload">
            <img src={UploadIcon} alt="Upload Icon" className="family-upload-icon" />
            <div className="upload-text-group">
              <p>Drag and drop files here</p>
              <p>OR</p>
              <p>Browse files</p>
            </div>
            <input
              type="file"
              name="other_file"
              className="family-detail-card-input"
              onChange={(e) => handleFileChange(e, index)}
            />
          </div>
        )}
        {/* Input Fields Section */}
        {(isFilled && !editMode[`other_document_${index}`]) ? (
          <>
            <div className="family-detail-two-column-group">
              <div className="family-detail-input-group">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Document Name:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {doc.other_document_name || 'N/A'}
                </span>
              </div>
              <div className="family-detail-input-group">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Number:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {doc.other_document_number || 'N/A'}
                </span>
              </div>
            </div>
            <div className="family-detail-two-column-group">
              <div className="family-detail-input-group">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Issued Date:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {doc.other_document_issued ? formatDisplayDate(doc.other_document_issued) : 'N/A'}
                </span>
              </div>
              <div className="family-detail-input-group">
                <label className={`family-detail-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                  Expiration Date:
                </label>
                <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
                  {doc.other_document_expiration ? formatDisplayDate(doc.other_document_expiration) : 'N/A'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="family-detail-two-column-group">
              <div className="family-detail-input-group">
                <label htmlFor={`other_document_name-${index}`} className="family-detail-label">
                  Document Name:
                </label>
                <input
                  type="text"
                  id={`other_document_name-${index}`}
                  name="other_document_name"
                  value={tempDoc.other_document_name || doc.other_document_name}
                  onChange={(e) => handleInputChange(e, index)}
                  className="family-detail-text-input"
                  placeholder="e.g., Health Card"
                />
              </div>
              <div className="family-detail-input-group">
                <label htmlFor={`other_document_number-${index}`} className="family-detail-label">
                  Number:
                </label>
                <input
                  type="text"
                  id={`other_document_number-${index}`}
                  name="other_document_number"
                  value={tempDoc.other_document_number || doc.other_document_number}
                  onChange={(e) => handleInputChange(e, index)}
                  className="family-detail-text-input"
                />
              </div>
            </div>
            <div className="family-detail-two-column-group">
              <div className="family-detail-input-group">
                <label htmlFor={`other_document_issued-${index}`} className="family-detail-label">
                  Issued Date:
                </label>
                <input
                  type="date"
                  id={`other_document_issued-${index}`}
                  name="other_document_issued"
                  value={
                    tempDoc.other_document_issued
                      ? tempDoc.other_document_issued.split("T")[0]
                      : doc.other_document_issued
                        ? doc.other_document_issued.split("T")[0]
                        : ''
                  }
                  onChange={(e) => handleInputChange(e, index)}
                  className="family-detail-text-input"
                />
              </div>
              <div className="family-detail-input-group">
                <label htmlFor={`other_document_expiration-${index}`} className="family-detail-label">
                  Expiration Date:
                </label>
                <input
                  type="date"
                  id={`other_document_expiration-${index}`}
                  name="other_document_expiration"
                  value={
                    tempDoc.other_document_expiration
                      ? tempDoc.other_document_expiration.split("T")[0]
                      : doc.other_document_expiration
                        ? doc.other_document_expiration.split("T")[0]
                        : ''
                  }
                  onChange={(e) => handleInputChange(e, index)}
                  className="family-detail-text-input"
                />
              </div>
            </div>
          </>
        )}
        {showButtons && (
          <div className="family-detail-button-group">
            <button
              type="button"
              className="family-detail-save-button"
              onClick={() => handleSaveCard('other_document', index)}
            >
              Save
            </button>
            <button
              type="button"
              className="family-detail-cancel-button"
              onClick={() => handleCancelCard('other_document', index)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNotesCard = () => {
    const isFilled = isCardFilled('notes');
    const showButtons = shouldShowButtons('notes') || editMode.notes;

    return (
      <div
        id="card-notes"
        className="family-detail-card notes-card"
        ref={(el) => {
          cardRefs.current['notesCard'] = el;
          console.log('Ref assigned for notesCard:', el);
        }}
      >
        <div className="family-detail-card-header">
          <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
            Notes
          </label>
          <span
            className="family-detail-card-options"
            onClick={() => toggleOptionsDropdown('notes')}
          >
            ...
          </span>
          {openDropdownId === 'notes' && (
            <div className="family-detail-card-options-dropdown">
              <div onClick={() => handleEditCard('notes')}>Edit</div>
              <div onClick={() => handleDeleteCard('notes')}>Delete</div>
            </div>
          )}
        </div>
        {(isFilled && !editMode.notes) ? (
          <span className={`family-detail-text ${isFilled ? 'family-detail-text-filled' : ''}`}>
            {formData.notes || 'N/A'}
          </span>
        ) : (
          <textarea
            name="notes"
            className="notes-textarea"
            value={tempInputData.notes || formData.notes}
            onChange={handleInputChange}
          />
        )}
        {showButtons && (
          <div className="family-detail-button-group">
            <button
              type="button"
              className="family-detail-save-button"
              onClick={() => handleSaveCard('notes')}
            >
              Save
            </button>
            <button
              type="button"
              className="family-detail-cancel-button"
              onClick={() => handleCancelCard('notes')}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  const PreviewPopup = () => {
    if (!showPreview || !previewFile) return null;

    const fileName = typeof previewFile === 'object' ? previewFile.name : previewFile;
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
    const fileUrl = typeof previewFile === 'object' ? URL.createObjectURL(previewFile) : `${import.meta.env.VITE_API_URL}/${previewFile}`;

    return (
      <div className="family-detail-preview-popup">
        <div className="family-detail-preview-content">
          <button className="family-detail-preview-close" onClick={closePreview}>
            ×
          </button>
          {isImage ? (
            <img
              src={fileUrl}
              alt="Preview"
              style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <iframe
              src={fileUrl}
              style={{ width: '90%', height: '80vh', border: 'none' }}
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="family-detail-loading">Loading...</div>;
  }

  const EmergencyContactPopup = () => {
    if (!showEmergencyPopup) return null;

    return (
      <div className="family-detail-emergency-popup">
        <div className="family-detail-emergency-content">
          <button className="family-detail-emergency-close" onClick={handleCancelEmergency}>
            ×
          </button>
          <h3>
            Are you sure you want to {pendingEmergencyValue ? 'mark' : 'unmark'} this contact as an emergency contact?
          </h3>
          <div className="family-detail-button-group">
            <button
              type="button"
              className="family-detail-cancel-button"
              onClick={handleCancelEmergency}
            >
              Cancel
            </button>
            <button
              type="button"
              className={pendingEmergencyValue ? 'family-detail-save-button' : 'family-detail-remove-button'}
              onClick={handleConfirmEmergency}
            >
              {pendingEmergencyValue ? 'Add' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="family-detail-page">
      <ToastContainer />
      <div className="family-detail-top-section">
        <div className="family-detail-top-section-inner">
          <h1 className="family-detail-section-title">Family Info & IDs</h1>
          <div className="family-detail-add-button-container">
            <button
              className="family-detail-add-button"
              onClick={handleAddButtonClick}
              type="button"
            >
              + Add
            </button>
            {showAddDropdown && (
              <div className="family-detail-add-dropdown">
                <div onClick={() => handleAddOptionClick('Driver License')}>Driver's License</div>
                <div onClick={() => handleAddOptionClick('Pan Card')}>PAN Card</div>
                <div onClick={() => handleAddOptionClick('Aadhaar Card')}>Aadhaar Card</div>
                <div onClick={() => handleAddOptionClick('Passport')}>Passport</div>
                <div onClick={() => handleAddOptionClick('Birth Certificate')}>Birth Certificate</div>
                <div onClick={() => handleAddOptionClick('Birthday')}>Birthday</div>
                <div onClick={() => handleAddOptionClick('Other')}>Other</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="family-detail-header">
        <div className="family-detail-info-container">
          <img
            src={
              formData.profile_image
                ? `${import.meta.env.VITE_API_URL}${formData.profile_image.replace(/\\/g, '/')}`
                : 'https://via.placeholder.com/100'
            }
            alt="Contact"
            className="family-detail-contact-image"
          />
          <div className="family-detail-name-relation">
            <h1 className="family-detail-title">
              {`${formData.firstName} ${formData.lastName}`.trim() || 'Family Member Details'}
            </h1>
            <span className="family-detail-relation">
              {formData.relation || 'Relation not specified'}
            </span>
          </div>
        </div>
        <div className="family-detail-emergency-container">
          <label className="family-detail-emergency-label">
            <input
              type="checkbox"
              checked={formData.emergencyContact}
              onChange={handleCheckboxChange}
              className="family-detail-emergency-checkbox"
            />
            Emergency Contact
          </label>
        </div>
      </div>
      <div className="family-detail-container">
        <form className="family-detail-form">
          <div className="family-detail-card-grid">
            {renderDocumentCard('driver_license_document', "Driver's License")}
            {renderDocumentCard('passport_document', 'Passport')}
            {renderDocumentCard('aadhaar_card_document', 'Aadhaar')}
            {renderDocumentCard('pan_card_document', 'PAN')}
            {renderDocumentCard('birth_certificate_document', 'Birth Certificate')}
            {renderNotesCard()}


            {renderBirthdayCard()}



            {formData.otherDocuments.map((doc, index) => renderOtherDocumentCard(doc, index))}
          </div>
        </form>
      </div>
      <PreviewPopup />
      <EmergencyContactPopup /> {/* Added */}
    </div>
  );
};

export default FamilyDetail;
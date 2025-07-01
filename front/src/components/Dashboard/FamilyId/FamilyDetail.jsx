import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './FamilyDetail.css';
import UploadIcon from '../../../assets/images/dash_icon/upload.svg';

const FamilyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    driverLicense: null,
    driverLicenseNumber: '',
    driverLicenseStateIssued: '',
    driverLicenseExpiration: '',
    aadhaar: null,
    aadhaarNumber: '',
    pan: null,
    panNumber: '',
    birthCertificate: null,
    passport: null,
    passportNumber: '',
    passportStateIssued: '',
    passportExpiration: '',
    notes: '',
    relation: '',
    otherDocuments: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [scrollToId, setScrollToId] = useState(null); 

  const cardRefs = useRef({});

  useEffect(() => {
    if (scrollToId && cardRefs.current[scrollToId]) {
      console.log('Scrolling to:', scrollToId, cardRefs.current[scrollToId]);
      const element = cardRefs.current[scrollToId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const offsetTop = element.getBoundingClientRect().top + window.scrollY - 20; 
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      } else {
        console.warn('Element not found for ID:', scrollToId);
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
                id: doc.id || `other-${Date.now()}-${Math.random()}`, // Ensure unique ID
                documentName: doc.document_name || '',
                number: doc.number || '',
                issuedDate: doc.issued_date || '',
                expirationDate: doc.expiration_date || '',
                file: doc.file || null,
              }))
            : [];

          setFormData({
            firstName: data.familyMember.first_name || '',
            lastName: data.familyMember.last_name || '',
            birthday: data.familyMember.birthday || '',
            driverLicense: data.familyMember.driver_license || null,
            driverLicenseNumber: data.familyMember.driver_license_number || '',
            driverLicenseStateIssued: data.familyMember.driver_license_state_issued || '',
            driverLicenseExpiration: data.familyMember.driver_license_expiration || '',
            aadhaar: data.familyMember.aadhaar || null,
            aadhaarNumber: data.familyMember.aadhaar_number || '',
            pan: data.familyMember.pan || null,
            panNumber: data.familyMember.pan_number || '',
            birthCertificate: data.familyMember.birth_certificate || null,
            passport: data.familyMember.passport || null,
            passportNumber: data.familyMember.passport_number || '',
            passportStateIssued: data.familyMember.passport_state_issued || '',
            passportExpiration: data.familyMember.passport_expiration || '',
            notes: data.familyMember.notes || '',
            relation: data.familyMember.relation || '',
            otherDocuments: fetchedOtherDocs,
          });
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
      updatedOtherDocs[docIndex].file = file;
      setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      formDataToSend.append('documentIndex', docIndex);
      formDataToSend.append('documentType', updatedOtherDocs[docIndex].documentName);
      formDataToSend.append('file', file);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/updateOtherDocumentFile`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`${updatedOtherDocs[docIndex].documentName} file updated.`, {
            position: 'top-right',
            autoClose: 3000,
          });
          if (data.updatedDocument && data.updatedDocument.file) {
            updatedOtherDocs[docIndex].file = data.updatedDocument.file;
            setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
          }
        } else {
          handleApiError(response, data, `Failed to update ${updatedOtherDocs[docIndex].documentName} file.`);
          updatedOtherDocs[docIndex].file = null;
          setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
        }
      } catch (err) {
        handleNetworkError(err, `Error updating ${updatedOtherDocs[docIndex].documentName} file.`);
        updatedOtherDocs[docIndex].file = null;
        setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: file }));

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      formDataToSend.append(name, file);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/update`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();

        if (data.success) {
          toast.success(`${name} updated successfully.`, {
            position: 'top-right',
            autoClose: 3000,
          });
          if (data.familyMember && data.familyMember[name]) {
            setFormData((prev) => ({ ...prev, [name]: data.familyMember[name] }));
          }
        } else {
          handleApiError(response, data, `Failed to update ${name}.`);
          setFormData((prev) => ({ ...prev, [name]: null }));
        }
      } catch (err) {
        handleNetworkError(err, `Error updating ${name}.`);
        setFormData((prev) => ({ ...prev, [name]: null }));
      }
    }
  };

  const handleInputChange = async (e, docIndex = null) => {
    const { name, value } = e.target;

    if (docIndex !== null) {
      const updatedOtherDocs = [...formData.otherDocuments];
      updatedOtherDocs[docIndex] = { ...updatedOtherDocs[docIndex], [name]: value };
      setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocs }));

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      formDataToSend.append('documentIndex', docIndex);

      Object.keys(updatedOtherDocs[docIndex]).forEach((key) => {
        if (key !== 'file' && updatedOtherDocs[docIndex][key] !== undefined) {
          formDataToSend.append(`otherDocuments[${docIndex}][${key}]`, updatedOtherDocs[docIndex][key]);
        }
      });

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/update`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();
        if (data.success) {
          toast.success(`'${updatedOtherDocs[docIndex].documentName}' updated.`, {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          handleApiError(response, data, `Failed to update '${updatedOtherDocs[docIndex].documentName}'.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error updating '${updatedOtherDocs[docIndex].documentName}'.`);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      const formDataToSend = new FormData();
      formDataToSend.append('id', id);
      formDataToSend.append(name, value);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/familyinfo/update`, {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });
        const data = await response.json();

        if (data.success) {
          const displayFieldName = name.replace(/([A-Z])/g, ' $1').toLowerCase();
          toast.success(`${displayFieldName} updated successfully.`, {
            position: 'top-right',
            autoClose: 3000,
          });
        } else {
          handleApiError(response, data, `Failed to update ${name}.`);
        }
      } catch (err) {
        handleNetworkError(err, `Error updating ${name}.`);
      }
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
  };

  const handleAddOptionClick = (option) => {
    setShowAddDropdown(false);

    const cardMapping = {
      'Driver License': 'driverLicenseCard',
      'Pan Card': 'panCard',
      'Aadhaar Card': 'aadhaarCard',
      'Passport': 'passportCard',
      'Birth Certificate': 'birthCertificateCard',
      'Birthday': 'birthdayCard',
    };

    if (option === 'Other') {
      const newOtherDoc = {
        id: `other-${Date.now()}-${Math.random()}`, 
        documentName: '',
        number: '',
        issuedDate: '',
        expirationDate: '',
        file: null,
      };
      setFormData((prev) => ({
        ...prev,
        otherDocuments: [...prev.otherDocuments, newOtherDoc],
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

  const renderOtherDocumentCard = (doc, index) => (
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
        <label className="family-detail-card-label">Other Document</label>
        <span className="family-detail-card-options">...</span>
      </div>
      <div className="family-detail-card-upload">
        <img src={UploadIcon} alt="Upload Icon" className="upload-icon" />
        <div className="upload-text-group">
          <p>Drag and drop files here</p>
          <p>OR</p>
          <p>Browse files</p>
        </div>
        <input
          type="file"
          name={`file`}
          className="family-detail-card-input"
          onChange={(e) => handleFileChange(e, index)}
        />
      </div>
      {doc.file && (
        <p className="family-detail-file-name">
          Uploaded: {typeof doc.file === 'object' ? doc.file.name : doc.file.split('/').pop()}
        </p>
      )}

      <div className="family-detail-two-column-group">
        <div className="family-detail-input-group">
          <label htmlFor={`documentName-${index}`} className="family-detail-label">Document Name:</label>
          <input
            type="text"
            id={`documentName-${index}`}
            name="documentName"
            value={doc.documentName}
            onChange={(e) => handleInputChange(e, index)}
            className="family-detail-text-input"
            placeholder="e.g., Health Card"
          />
        </div>
        <div className="family-detail-input-group">
          <label htmlFor={`otherNumber-${index}`} className="family-detail-label">Number:</label>
          <input
            type="text"
            id={`otherNumber-${index}`}
            name="number"
            value={doc.number}
            onChange={(e) => handleInputChange(e, index)}
            className="family-detail-text-input"
          />
        </div>
      </div>

      <div className="family-detail-two-column-group">
        <div className="family-detail-input-group">
          <label htmlFor={`issuedDate-${index}`} className="family-detail-label">Issued Date:</label>
          <input
            type="date"
            id={`issuedDate-${index}`}
            name="issuedDate"
            value={doc.issuedDate}
            onChange={(e) => handleInputChange(e, index)}
            className="family-detail-text-input"
          />
        </div>
        <div className="family-detail-input-group">
          <label htmlFor={`expirationDate-${index}`} className="family-detail-label">Expiration Date:</label>
          <input
            type="date"
            id={`expirationDate-${index}`}
            name="expirationDate"
            value={doc.expirationDate}
            onChange={(e) => handleInputChange(e, index)}
            className="family-detail-text-input"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="family-detail-loading">Loading...</div>;
  }

  return (
    <div className="family-detail-page">
      <ToastContainer />
      <div className="family-detail-header">
        <h1 className="family-detail-title">
          {`${formData.firstName} ${formData.lastName}`.trim() || 'Family Member Details'}
        </h1>
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
      <div className="family-detail-container">
        <form className="family-detail-form">
          <div className="family-detail-card-grid">
            {/* Driver's License Card */}
            <div
              id="card-driverLicense"
              className="family-detail-card"
              ref={(el) => {
                cardRefs.current['driverLicenseCard'] = el;
                console.log('Ref assigned for driverLicenseCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Driver's License</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <img src={UploadIcon} alt="Upload Icon" className="family-upload-icon" />
                <div className="upload-text-group">
                  <p>Drag and drop files here</p>
                  <p>OR</p>
                  <p>Browse files</p>
                </div>
                <input
                  type="file"
                  name="driverLicense"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
              </div>
              {formData.driverLicense && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.driverLicense === 'object' ? formData.driverLicense.name : formData.driverLicense.split('/').pop()}
                </p>
              )}

              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label htmlFor="driverLicenseNumber" className="family-detail-label">Number:</label>
                  <input
                    type="text"
                    id="driverLicenseNumber"
                    name="driverLicenseNumber"
                    value={formData.driverLicenseNumber}
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
                    value={formData.driverLicenseStateIssued}
                    onChange={handleInputChange}
                    className="family-detail-text-input"
                  />
                </div>
              </div>
              <div className="family-detail-input-group family-detail-single-column">
                <label htmlFor="driverLicenseExpiration" className="family-detail-label">Expiration Date:</label>
                <input
                  type="date"
                  id="driverLicenseExpiration"
                  name="driverLicenseExpiration"
                  value={formData.driverLicenseExpiration}
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </div>

            {/* Passport Card */}
            <div
              id="card-passport"
              className="family-detail-card"
              ref={(el) => {
                cardRefs.current['passportCard'] = el;
                console.log('Ref assigned for passportCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Passport</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <img src={UploadIcon} alt="Upload Icon" className="upload-icon" />
                <div className="upload-text-group">
                  <p>Drag and drop files here</p>
                  <p>OR</p>
                  <p>Browse files</p>
                </div>
                <input
                  type="file"
                  name="passport"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
              </div>
              {formData.passport && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.passport === 'object' ? formData.passport.name : formData.passport.split('/').pop()}
                </p>
              )}

              <div className="family-detail-two-column-group">
                <div className="family-detail-input-group">
                  <label htmlFor="passportNumber" className="family-detail-label">Number:</label>
                  <input
                    type="text"
                    id="passportNumber"
                    name="passportNumber"
                    value={formData.passportNumber}
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
                    value={formData.passportStateIssued}
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
                  value={formData.passportExpiration}
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </div>

            {/* Aadhaar Card */}
            <div
              id="card-aadhaar"
              className="family-detail-card"
              ref={(el) => {
                cardRefs.current['aadhaarCard'] = el;
                console.log('Ref assigned for aadhaarCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Aadhaar</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <img src={UploadIcon} alt="Upload Icon" className="upload-icon" />
                <div className="upload-text-group">
                  <p>Drag and drop files here</p>
                  <p>OR</p>
                  <p>Browse files</p>
                </div>
                <input
                  type="file"
                  name="aadhaar"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
              </div>
              {formData.aadhaar && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.aadhaar === 'object' ? formData.aadhaar.name : formData.aadhaar.split('/').pop()}
                </p>
              )}
              <div className="family-detail-input-group">
                <label htmlFor="aadhaarNumber" className="family-detail-label">Number:</label>
                <input
                  type="text"
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </div>

            {/* PAN Card */}
            <div
              id="card-pan"
              className="family-detail-card"
              ref={(el) => {
                cardRefs.current['panCard'] = el;
                console.log('Ref assigned for panCard:', el);
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">PAN</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <img src={UploadIcon} alt="Upload Icon" className="upload-icon" />
                <div className="upload-text-group">
                  <p>Drag and drop files here</p>
                  <p>OR</p>
                  <p>Browse files</p>
                </div>
                <input
                  type="file"
                  name="pan"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
              </div>
              {formData.pan && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.pan === 'object' ? formData.pan.name : formData.pan.split('/').pop()}
                </p>
              )}
              <div className="family-detail-input-group">
                <label htmlFor="panNumber" className="family-detail-label">Number:</label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="family-detail-text-input"
                />
              </div>
            </div>

            {/* Birth Certificate Card */}
            <div
              id="card-birthCertificate"
              className="family-detail-card"
              ref={(el) => {
                cardRefs.current['birthCertificateCard'] = el;
                console.log('Ref assigned for birthCertificateCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Birth Certificate</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <img src={UploadIcon} alt="Upload Icon" className="upload-icon" />
                <div className="upload-text-group">
                  <p>Drag and drop files here</p>
                  <p>OR</p>
                  <p>Browse files</p>
                </div>
                <input
                  type="file"
                  name="birthCertificate"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
              </div>
              {formData.birthCertificate && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.birthCertificate === 'object' ? formData.birthCertificate.name : formData.birthCertificate.split('/').pop()}
                </p>
              )}
            </div>

            {/* Notes Card */}
            <div
              id="card-notes"
              className="family-detail-card notes-card"
              ref={(el) => {
                cardRefs.current['notesCard'] = el;
                console.log('Ref assigned for notesCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Notes</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <textarea
                name="notes"
                className="notes-textarea"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Birthday Card */}
            <div
              id="card-birthday"
              className="family-detail-card birthday-card"
              ref={(el) => {
                cardRefs.current['birthdayCard'] = el;
                console.log('Ref assigned for birthdayCard:', el); 
              }}
            >
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Birthday</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="birthday-content">
                <div className="birthday-date-row">
                  <span className="birthday-date-display">
                    {formatDisplayDate(formData.birthday)}
                  </span>
                  <span className="remaining-days">{getDaysUntilBirthday(formData.birthday)}</span>
                </div>
              </div>
            </div>

            {formData.otherDocuments.map((doc, index) => renderOtherDocumentCard(doc, index))}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyDetail;
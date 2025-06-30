import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FamilyDetail.css';

const FamilyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '', // This will hold the ISO string from DB
    driverLicense: null,
    aadhaar: null,
    pan: null,
    birthCertificate: null,
    passport: null,
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  // Helper to format date for display (DD/MM/YYYY)
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'dd/mm/yyyy'; // Placeholder if no date
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date for display:", e);
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
          setFormData({
            firstName: data.familyMember.first_name || '',
            lastName: data.familyMember.last_name || '',
            birthday: data.familyMember.birthday || '', // Store as is (ISO string)
            driverLicense: data.familyMember.driver_license || null,
            aadhaar: data.familyMember.aadhaar || null,
            pan: data.familyMember.pan || null,
            birthCertificate: data.familyMember.birth_certificate || null,
            passport: data.familyMember.passport || null,
            notes: data.familyMember.notes || '',
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

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
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
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.', {
              position: 'top-right',
              autoClose: 3000,
              onClose: () => navigate('/login'),
            });
          } else {
            toast.error(data.message || `Failed to update ${name}.`, {
              position: 'top-right',
              autoClose: 3000,
            });
          }
          setFormData((prev) => ({ ...prev, [name]: null }));
        }
      } catch (err) {
        console.error(`Error updating ${name}:`, err);
        toast.error(`Error updating ${name}. Please try again.`, {
          position: 'top-right',
          autoClose: 3000,
        });
        setFormData((prev) => ({ ...prev, [name]: null }));
      }
    }
  };

  const handleNotesChange = async (e) => {
    const { name, value } = e.target;
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
        toast.success('Notes updated successfully.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.', {
            position: 'top-right',
            autoClose: 3000,
            onClose: () => navigate('/login'),
          });
        } else {
          toast.error(data.message || 'Failed to update notes.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }
    } catch (err) {
      console.error('Error updating notes:', err);
      toast.error('Error updating notes. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const getDaysUntilBirthday = (birthdayString) => {
    if (!birthdayString) return '-'; // Show dash if no birthday
    const today = new Date();
    const birthDate = new Date(birthdayString);

    // Validate the date string
    if (isNaN(birthDate.getTime())) {
      return '-'; // Return dash if date is invalid
    }

    // Get current year's birthday
    let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    // If this year's birthday has passed, consider next year's birthday
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = Math.abs(nextBirthday - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today!';
    if (diffDays === 1) return 'Tomorrow!';
    return `${diffDays} days remaining`;
  };

  if (loading) {
    return <div className="family-detail-loading">Loading...</div>;
  }

  return (
    <div className="family-detail-page">
      <ToastContainer />
      <div className="family-detail-header">
        <h1 className="family-detail-title">Family Info and IDs</h1>
        <button className="family-detail-add-button">Add</button>
      </div>
      <div className="family-detail-container">
        <form className="family-detail-form">
          <div className="family-detail-card-grid">
            {/* Driver's License Card */}
            <div className="family-detail-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Driver's License</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <input
                  type="file"
                  name="driverLicense"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
                <p>Drag and drop files here<br />OR<br />Browse files</p>
              </div>
              {formData.driverLicense && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.driverLicense === 'object' ? formData.driverLicense.name : formData.driverLicense.split('/').pop()}
                </p>
              )}
            </div>

            {/* Passport Card */}
            <div className="family-detail-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Passport</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <input
                  type="file"
                  name="passport"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
                <p>Drag and drop files here<br />OR<br />Browse files</p>
              </div>
              {formData.passport && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.passport === 'object' ? formData.passport.name : formData.passport.split('/').pop()}
                </p>
              )}
            </div>

            {/* Aadhaar Card */}
            <div className="family-detail-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Aadhaar</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <input
                  type="file"
                  name="aadhaar"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
                <p>Drag and drop files here<br />OR<br />Browse files</p>
              </div>
              {formData.aadhaar && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.aadhaar === 'object' ? formData.aadhaar.name : formData.aadhaar.split('/').pop()}
                </p>
              )}
            </div>

            {/* PAN Card */}
            <div className="family-detail-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">PAN</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <input
                  type="file"
                  name="pan"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
                <p>Drag and drop files here<br />OR<br />Browse files</p>
              </div>
              {formData.pan && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.pan === 'object' ? formData.pan.name : formData.pan.split('/').pop()}
                </p>
              )}
            </div>

            {/* Birth Certificate Card */}
            <div className="family-detail-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Birth Certificate</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <div className="family-detail-card-upload">
                <input
                  type="file"
                  name="birthCertificate"
                  className="family-detail-card-input"
                  onChange={handleFileChange}
                />
                <p>Drag and drop files here<br />OR<br />Browse files</p>
              </div>
              {formData.birthCertificate && (
                <p className="family-detail-file-name">
                  Uploaded: {typeof formData.birthCertificate === 'object' ? formData.birthCertificate.name : formData.birthCertificate.split('/').pop()}
                </p>
              )}
            </div>

            {/* Notes Card */}
            <div className="family-detail-card notes-card">
              <div className="family-detail-card-header">
                <label className="family-detail-card-label">Notes</label>
                <span className="family-detail-card-options">...</span>
              </div>
              <textarea
                name="notes"
                className="notes-textarea"
                value={formData.notes}
                onChange={handleNotesChange}
                placeholder="Add your notes here..."
              />
            </div>

            {/* Birthday Card */}
            <div className="family-detail-card birthday-card">
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
          </div>
          <div className="family-detail-form-actions">
            {/* Save button removed */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyDetail;
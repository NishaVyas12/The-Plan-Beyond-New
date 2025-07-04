import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FamilyDetail.css';
import UploadIcon from '../../../assets/images/dash_icon/upload.svg';
import ImageIcon from '../../../assets/images/dash_icon/image.svg';
import PdfIcon from '../../../assets/images/dash_icon/pdf.svg';
import CrossIcon from '../../../assets/images/dash_icon/trash.svg';

const PetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        birthday: '',
        insurance_document: null,
        insurance_provider: '',
        policy_number: '',
        policy_holder: '',
        company_name: '',
        agent_contact: '',
        nominee_name: '',
        insurance_issued: '',
        insurance_expiration: '',
        notes: '',
        breed: '',
        profile_image: '',
    });
    const [initialFormData, setInitialFormData] = useState(null);
    const [tempInputData, setTempInputData] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const [scrollToId, setScrollToId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [editMode, setEditMode] = useState({});
    const cardRefs = useRef({});

    const handleSaveCard = async (fieldName) => {
        let payload = {};
        if (fieldName === 'notes') {
            payload = { notes: tempInputData.notes || formData.notes };
        } else if (fieldName === 'birthday') {
            payload = {
                birthday: tempInputData.birthday
                    ? tempInputData.birthday.split("T")[0]
                    : formData.birthday || '',
            };
        } else if (fieldName === 'insurance_document') {
            payload = {
                insurance_provider: tempInputData.insurance_provider || formData.insurance_provider,
                policy_number: tempInputData.policy_number || formData.policy_number,
                policy_holder: tempInputData.policy_holder || formData.policy_holder,
                company_name: tempInputData.company_name || formData.company_name,
                agent_contact: tempInputData.agent_contact || formData.agent_contact,
                nominee_name: tempInputData.nominee_name || formData.nominee_name,
                insurance_issued: tempInputData.insurance_issued
                    ? tempInputData.insurance_issued.split("T")[0]
                    : formData.insurance_issued || '',
                insurance_expiration: tempInputData.insurance_expiration
                    ? tempInputData.insurance_expiration.split("T")[0]
                    : formData.insurance_expiration || '',
            };
        }

        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        Object.entries(payload).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });
        if (fieldName === 'insurance_document' && formData.insurance_document && typeof formData.insurance_document === 'object') {
            formDataToSend.append('insurance_document', formData.insurance_document);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formDataToSend,
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`${fieldName.replace('_document', '')} updated successfully.`, {
                    position: 'top-right',
                    autoClose: 3000,
                });
                setFormData((prev) => ({
                    ...prev,
                    ...payload,
                    [fieldName]: data.pet[fieldName] || formData[fieldName],
                }));
                setInitialFormData((prev) => ({
                    ...prev,
                    ...payload,
                    [fieldName]: data.pet[fieldName] || formData[fieldName],
                }));
                setTempInputData((prev) => {
                    const newTemp = { ...prev };
                    Object.keys(payload).forEach((key) => delete newTemp[key]);
                    return newTemp;
                });
                setEditMode((prev) => ({ ...prev, [fieldName]: false }));
            } else {
                handleApiError(response, data, `Failed to update ${fieldName.replace('_document', '')}.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error updating ${fieldName.replace('_document', '')}.`);
        }
    };

    const handleCancelCard = (fieldName) => {
        const cardFields = {
            insurance_document: [
                'insurance_provider',
                'policy_number',
                'policy_holder',
                'company_name',
                'agent_contact',
                'nominee_name',
                'insurance_issued',
                'insurance_expiration',
            ],
            notes: ['notes'],
            birthday: ['birthday'],
        };
        setTempInputData((prev) => {
            const newTemp = { ...prev };
            (cardFields[fieldName] || []).forEach((key) => delete newTemp[key]);
            return newTemp;
        });
        if (fieldName === 'insurance_document' && formData.insurance_document && typeof formData.insurance_document === 'object') {
            setFormData((prev) => ({ ...prev, insurance_document: initialFormData.insurance_document || null }));
        } else if (fieldName === 'birthday') {
            setFormData((prev) => ({ ...prev, birthday: initialFormData.birthday || '' }));
        } else if (fieldName === 'notes') {
            setFormData((prev) => ({ ...prev, notes: initialFormData.notes || '' }));
        }
        setEditMode((prev) => ({ ...prev, [fieldName]: false }));
    };

    const handleDeleteFile = async (fieldName) => {
        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        formDataToSend.append(fieldName, '');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formDataToSend,
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`${fieldName.replace('_document', '')} file deleted successfully.`, {
                    position: 'top-right',
                    autoClose: 3000,
                });
                setFormData((prev) => ({ ...prev, [fieldName]: null }));
                setInitialFormData((prev) => ({ ...prev, [fieldName]: null }));
            } else {
                handleApiError(response, data, `Failed to delete ${fieldName.replace('_document', '')} file.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error deleting ${fieldName.replace('_document', '')} file.`);
        }
    };

    const handleDeleteCard = async (fieldName) => {
        const cardFields = {
            insurance_document: {
                insurance_provider: '',
                policy_number: '',
                policy_holder: '',
                company_name: '',
                agent_contact: '',
                nominee_name: '',
                insurance_issued: '',
                insurance_expiration: '',
                insurance_document: '',
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formDataToSend,
            });
            const data = await response.json();
            if (data.success) {
                setFormData((prev) => ({
                    ...prev,
                    ...cardFields[fieldName],
                    [fieldName]: null,
                }));
                setInitialFormData((prev) => ({
                    ...prev,
                    ...cardFields[fieldName],
                    [fieldName]: null,
                }));
                setTempInputData((prev) => {
                    const newTemp = { ...prev };
                    Object.keys(cardFields[fieldName]).forEach((key) => delete newTemp[key]);
                    return newTemp;
                });
                setEditMode((prev) => ({ ...prev, [fieldName]: false }));
                toast.success(`${fieldName.replace('_document', '')} deleted successfully.`, {
                    position: 'top-right',
                    autoClose: 3000,
                });
            } else {
                handleApiError(response, data, `Failed to delete ${fieldName.replace('_document', '')}.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error deleting ${fieldName.replace('_document', '')}.`);
        }
    };

    useEffect(() => {
        if (scrollToId && cardRefs.current[scrollToId]) {
            const element = cardRefs.current[scrollToId];
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const offsetTop = element.getBoundingClientRect().top + window.scrollY - 20;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
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
            console.error('Error formatting date:', e);
            return 'dd/mm/yyyy';
        }
    };

    useEffect(() => {
        const fetchPet = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (data.success) {
                    const fetchedData = {
                        name: data.pet.name || '',
                        birthday: data.pet.birthday || '',
                        insurance_document: data.pet.insurance_document || null,
                        insurance_provider: data.pet.insurance_provider || '',
                        policy_number: data.pet.policy_number || '',
                        policy_holder: data.pet.policy_holder || '',
                        company_name: data.pet.company_name || '',
                        agent_contact: data.pet.agent_contact || '',
                        nominee_name: data.pet.nominee_name || '',
                        insurance_issued: data.pet.insurance_issued || '',
                        insurance_expiration: data.pet.insurance_expiration || '',
                        notes: data.pet.notes || '',
                        breed: data.pet.breed || '',
                        profile_image: data.pet.profile_image || '',
                    };
                    setFormData(fetchedData);
                    setInitialFormData(fetchedData);
                } else {
                    handleApiError(response, data, 'Failed to fetch pet details.');
                }
            } catch (err) {
                handleNetworkError(err, 'Error fetching pet details.');
            } finally {
                setLoading(false);
            }
        };
        fetchPet();
    }, [id, navigate]);

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, [name]: file }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTempInputData((prev) => ({ ...prev, [name]: value }));
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
        toast.error(`${defaultMessage} Please try again.`, {
            position: 'top-right',
            autoClose: 3000,
        });
    };

    const getDaysUntilBirthday = (birthdayString) => {
        if (!birthdayString) return '-';
        const today = new Date();
        const birthDate = new Date(birthdayString);
        if (isNaN(birthDate.getTime())) return '-';
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
        setOpenDropdownId(null);
    };

    const toggleOptionsDropdown = (cardId) => {
        setOpenDropdownId(openDropdownId === cardId ? null : cardId);
        setShowAddDropdown(false);
    };

    const handleEditCard = (fieldName) => {
        setEditMode((prev) => ({ ...prev, [fieldName]: true }));
        setOpenDropdownId(null);
    };

    const handleAddOptionClick = (option) => {
        setShowAddDropdown(false);
        const cardMapping = {
            'Birthday': 'birthdayCard',
            'Insurance': 'insurance_document',
            'Notes': 'notesCard',
        };
        const targetId = cardMapping[option];
        if (targetId) {
            setScrollToId(targetId);
        } else {
            toast.info(`Card for '${option}' is not available.`, {
                position: 'top-right',
                autoClose: 2000,
            });
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
        return /\.(jpg|jpeg|png|gif)$/i.test(fileName) ? ImageIcon : PdfIcon;
    };

    const isCardFilled = (fieldName) => {
        switch (fieldName) {
            case 'insurance_document':
                return (
                    formData.insurance_provider ||
                    formData.policy_number ||
                    formData.policy_holder ||
                    formData.company_name ||
                    formData.agent_contact ||
                    formData.nominee_name ||
                    formData.insurance_issued ||
                    formData.insurance_expiration
                );
            case 'notes':
                return formData.notes;
            case 'birthday':
                return formData.birthday;
            default:
                return false;
        }
    };

    const shouldShowButtons = (fieldName) => {
        const cardFields = {
            insurance_document: [
                'insurance_provider',
                'policy_number',
                'policy_holder',
                'company_name',
                'agent_contact',
                'nominee_name',
                'insurance_issued',
                'insurance_expiration',
            ],
            notes: ['notes'],
            birthday: ['birthday'],
        };
        return (
            !isCardFilled(fieldName) ||
            cardFields[fieldName]?.some((key) => tempInputData[key] !== undefined) ||
            (fieldName === 'insurance_document' && formData.insurance_document && typeof formData.insurance_document === 'object') ||
            editMode[fieldName]
        );
    };

    const renderBirthdayCard = () => {
        const isFilled = isCardFilled('birthday');
        const showButtons = shouldShowButtons('birthday');

        return (
            <div
                id="card-birthday"
                className="family-detail-card birthday-card"
                ref={(el) => (cardRefs.current['birthdayCard'] = el)}
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

    const renderInsuranceCard = () => {
        const isFilled = isCardFilled('insurance_document');
        const showButtons = shouldShowButtons('insurance_document');

        return (
            <div
                id="card-insurance_document"
                className="family-detail-card"
                ref={(el) => (cardRefs.current['insurance_document'] = el)}
            >
                <div className="family-detail-card-header">
                    <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                        Insurance
                    </label>
                    <span
                        className="family-detail-card-options"
                        onClick={() => toggleOptionsDropdown('insurance_document')}
                    >
                        ...
                    </span>
                    {openDropdownId === 'insurance_document' && (
                        <div className="family-detail-card-options-dropdown">
                            <div onClick={() => handleEditCard('insurance_document')}>Edit</div>
                            <div onClick={() => handleDeleteCard('insurance_document')}>Delete</div>
                        </div>
                    )}
                </div>
                {formData.insurance_document ? (
                    <div className="family-detail-file-container">
                        <img
                            src={getFileIcon(formData.insurance_document)}
                            alt="Insurance Icon"
                            className="family-detail-file-icon"
                        />
                        <span
                            className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
                            onClick={() => handlePreview(formData.insurance_document)}
                        >
                            {typeof formData.insurance_document === 'object'
                                ? formData.insurance_document.name
                                : formData.insurance_document.split('/').pop()}
                        </span>
                        <img
                            src={CrossIcon}
                            alt="Delete Icon"
                            className="family-detail-delete-icon"
                            onClick={() => handleDeleteFile('insurance_document')}
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
                            name="insurance_document"
                            className="family-detail-card-input"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
                {(isFilled && !editMode.insurance_document) ? (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Insurance Provider:</label>
                                <span className="family-detail-text">{formData.insurance_provider || 'N/A'}</span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Policy Number:</label>
                                <span className="family-detail-text">{formData.policy_number || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Policy Holder:</label>
                                <span className="family-detail-text">{formData.policy_holder || 'N/A'}</span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Company Name:</label>
                                <span className="family-detail-text">{formData.company_name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Agent Contact:</label>
                                <span className="family-detail-text">{formData.agent_contact || 'N/A'}</span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Nominee Name:</label>
                                <span className="family-detail-text">{formData.nominee_name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Issued Date:</label>
                                <span className="family-detail-text">
                                    {formData.insurance_issued ? formatDisplayDate(formData.insurance_issued) : 'N/A'}
                                </span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Expiration Date:</label>
                                <span className="family-detail-text">
                                    {formData.insurance_expiration ? formatDisplayDate(formData.insurance_expiration) : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="insurance_provider" className="family-detail-label">Insurance Provider:</label>
                                <input
                                    type="text"
                                    id="insurance_provider"
                                    name="insurance_provider"
                                    value={tempInputData.insurance_provider || formData.insurance_provider}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="policy_number" className="family-detail-label">Policy Number:</label>
                                <input
                                    type="text"
                                    id="policy_number"
                                    name="policy_number"
                                    value={tempInputData.policy_number || formData.policy_number}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="policy_holder" className="family-detail-label">Policy Holder:</label>
                                <input
                                    type="text"
                                    id="policy_holder"
                                    name="policy_holder"
                                    value={tempInputData.policy_holder || formData.policy_holder}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="company_name" className="family-detail-label">Company Name:</label>
                                <input
                                    type="text"
                                    id="company_name"
                                    name="company_name"
                                    value={tempInputData.company_name || formData.company_name}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="agent_contact" className="family-detail-label">Agent Contact:</label>
                                <input
                                    type="text"
                                    id="agent_contact"
                                    name="agent_contact"
                                    value={tempInputData.agent_contact || formData.agent_contact}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="nominee_name" className="family-detail-label">Nominee Name:</label>
                                <input
                                    type="text"
                                    id="nominee_name"
                                    name="nominee_name"
                                    value={tempInputData.nominee_name || formData.nominee_name}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="insurance_issued" className="family-detail-label">Issued Date:</label>
                                <input
                                    type="date"
                                    id="insurance_issued"
                                    name="insurance_issued"
                                    value={
                                        tempInputData.insurance_issued
                                            ? tempInputData.insurance_issued.split("T")[0]
                                            : formData.insurance_issued
                                                ? formData.insurance_issued.split("T")[0]
                                                : ''
                                    }
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="insurance_expiration" className="family-detail-label">Expiration Date:</label>
                                <input
                                    type="date"
                                    id="insurance_expiration"
                                    name="insurance_expiration"
                                    value={
                                        tempInputData.insurance_expiration
                                            ? tempInputData.insurance_expiration.split("T")[0]
                                            : formData.insurance_expiration
                                                ? formData.insurance_expiration.split("T")[0]
                                                : ''
                                    }
                                    onChange={handleInputChange}
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
                            onClick={() => handleSaveCard('insurance_document')}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('insurance_document')}
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
        const showButtons = shouldShowButtons('notes');

        return (
            <div
                id="card-notes"
                className="family-detail-card notes-card"
                ref={(el) => (cardRefs.current['notesCard'] = el)}
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

    return (
        <div className="family-detail-page">
            <ToastContainer />
            <div className="family-detail-top-section">
                <div className="family-detail-top-section-inner">
                    <h1 className="family-detail-section-title">Pet Info</h1>
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
                                <div onClick={() => handleAddOptionClick('Birthday')}>Birthday</div>
                                <div onClick={() => handleAddOptionClick('Insurance')}>Insurance</div>
                                <div onClick={() => handleAddOptionClick('Notes')}>Notes</div>
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
                        alt="Pet"
                        className="family-detail-contact-image"
                    />
                    <div className="family-detail-name-relation">
                        <h1 className="family-detail-title">
                            {formData.name || 'Pet Details'}
                        </h1>
                        <span className="family-detail-relation">
                            {formData.breed || 'Breed not specified'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="family-detail-container">
                <form className="family-detail-form">
                    <div className="family-detail-card-grid">
                        {renderInsuranceCard()}
                        {renderNotesCard()}
                        {renderBirthdayCard()}
                    </div>
                </form>
            </div>
            <PreviewPopup />
        </div>
    );
};

export default PetDetails;
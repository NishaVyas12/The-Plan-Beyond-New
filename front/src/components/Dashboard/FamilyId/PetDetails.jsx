
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
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
        photo: '',
        tag_document: null,
        tag_number: '',
        tag_type: '',
        vet_document: null,
        vet_clinic_name: '',
        vet_contact_info: '',
        vaccine_date: '',
    });
    const [initialFormData, setInitialFormData] = useState(null);
    const [tempInputData, setTempInputData] = useState({});
    const [loading, setLoading] = useState(true);
    const [cardLoading, setCardLoading] = useState({});
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const [scrollToId, setScrollToId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [contacts, setContacts] = useState([]);
    const [nominees, setNominees] = useState([]);
    const cardRefs = useRef({});

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
                        photo: data.pet.photo || '',
                        tag_document: data.pet.tag_document || null,
                        tag_number: data.pet.tag_number || '',
                        tag_type: data.pet.tag_type || '',
                        vet_document: data.pet.vet_document || null,
                        vet_clinic_name: data.pet.vet_clinic_name || '',
                        vet_contact_info: data.pet.vet_contact_info || '',
                        vaccine_date: data.pet.vaccine_date || '',
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

        const fetchContacts = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contacts`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (data.success) {
                    setContacts(data.contacts.map(contact => ({
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
                    setNominees(data.nominees.map(nominee => ({
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

        fetchPet();
        fetchContacts();
        fetchNominees();
    }, [id, navigate]);

    const handleSaveCard = async (fieldName) => {
        setCardLoading((prev) => ({ ...prev, [fieldName]: true }));
        let payload = {};
        if (fieldName === 'notes') {
            payload = { notes: tempInputData.notes || formData.notes, name: formData.name };
        } else if (fieldName === 'birthday') {
            payload = {
                birthday: tempInputData.birthday
                    ? tempInputData.birthday.split("T")[0]
                    : formData.birthday || '',
                name: formData.name,
            };
        } else if (fieldName === 'insurance_document') {
            payload = {
                name: formData.name,
                insurance_provider: tempInputData.insurance_provider || formData.insurance_provider,
                policy_number: tempInputData.policy_number || formData.policy_number,
                policy_holder: tempInputData.policy_holder || formData.policy_holder,
                company_name: tempInputData.company_name || formData.company_name,
                agent_contact: tempInputData.agent_contact?.value || formData.agent_contact || '',
                nominee_name: tempInputData.nominee_name?.value || formData.nominee_name || '',
                insurance_issued: tempInputData.insurance_issued
                    ? tempInputData.insurance_issued.split("T")[0]
                    : formData.insurance_issued || '',
                insurance_expiration: tempInputData.insurance_expiration
                    ? tempInputData.insurance_expiration.split("T")[0]
                    : formData.insurance_expiration || '',
            };
        } else if (fieldName === 'tag_document') {
            payload = {
                name: formData.name,
                tag_number: tempInputData.tag_number || formData.tag_number,
                tag_type: tempInputData.tag_type || formData.tag_type,
            };
        } else if (fieldName === 'vet_document') {
            payload = {
                name: formData.name,
                vet_clinic_name: tempInputData.vet_clinic_name || formData.vet_clinic_name,
                vet_contact_info: tempInputData.vet_contact_info || formData.vet_contact_info,
                vaccine_date: tempInputData.vaccine_date
                    ? tempInputData.vaccine_date.split("T")[0]
                    : formData.vaccine_date || '',
            };
        }

        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        Object.entries(payload).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });
        if (tempInputData[fieldName] && typeof tempInputData[fieldName] === 'object') {
            formDataToSend.append(fieldName, tempInputData[fieldName]);
        }

        console.log('Sending FormData for save:', Object.fromEntries(formDataToSend));

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
                    [fieldName]: data.pet[fieldName] || tempInputData[fieldName] || formData[fieldName],
                }));
                setInitialFormData((prev) => ({
                    ...prev,
                    ...payload,
                    [fieldName]: data.pet[fieldName] || tempInputData[fieldName] || formData[fieldName],
                }));
                setTempInputData((prev) => {
                    const newTemp = { ...prev };
                    Object.keys(payload).forEach((key) => delete newTemp[key]);
                    delete newTemp[fieldName];
                    return newTemp;
                });
                setEditMode((prev) => ({ ...prev, [fieldName]: false }));
                setFileInputKey(Date.now());
            } else {
                handleApiError(response, data, `Failed to update ${fieldName.replace('_document', '')}.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error updating ${fieldName.replace('_document', '')}.`);
        } finally {
            setCardLoading((prev) => ({ ...prev, [fieldName]: false }));
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
                'insurance_document',
            ],
            notes: ['notes'],
            birthday: ['birthday'],
            tag_document: ['tag_number', 'tag_type', 'tag_document'],
            vet_document: ['vet_clinic_name', 'vet_contact_info', 'vaccine_date', 'vet_document'],
        };
        setTempInputData((prev) => {
            const newTemp = { ...prev };
            (cardFields[fieldName] || []).forEach((key) => delete newTemp[key]);
            return newTemp;
        });
        setFormData((prev) => ({
            ...prev,
            [fieldName]: initialFormData[fieldName] || null,
            ...(cardFields[fieldName] || []).reduce((acc, key) => ({
                ...acc,
                [key]: initialFormData[key] || '',
            }), {}),
        }));
        setEditMode((prev) => ({ ...prev, [fieldName]: false }));
        setFileInputKey(Date.now());
    };

    const handleDeleteFile = async (fieldName) => {
        setCardLoading((prev) => ({ ...prev, [fieldName]: true }));
        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        formDataToSend.append('name', formData.name);
        formDataToSend.append(fieldName, '');

        console.log('Sending FormData for delete:', Object.fromEntries(formDataToSend));

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
                setTempInputData((prev) => {
                    const newTemp = { ...prev };
                    delete newTemp[fieldName];
                    return newTemp;
                });
                setFileInputKey(Date.now());
            } else {
                handleApiError(response, data, `Failed to delete ${fieldName.replace('_document', '')} file.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error deleting ${fieldName.replace('_document', '')} file.`);
        } finally {
            setCardLoading((prev) => ({ ...prev, [fieldName]: false }));
        }
    };

    const handleDeleteCard = async (fieldName) => {
        setCardLoading((prev) => ({ ...prev, [fieldName]: true }));
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
            tag_document: {
                tag_number: '',
                tag_type: '',
                tag_document: '',
            },
            vet_document: {
                vet_clinic_name: '',
                vet_contact_info: '',
                vaccine_date: '',
                vet_document: '',
            },
        };

        const payload = { ...cardFields[fieldName], name: formData.name };
        const formDataToSend = new FormData();
        formDataToSend.append('id', id);
        Object.entries(payload).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });

        console.log('Sending FormData for card delete:', Object.fromEntries(formDataToSend));

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
                setFileInputKey(Date.now());
                toast.success(`${fieldName.replace('_document', '')} deleted successfully.`, {
                    position: 'top-right',
                    autoClose: 3000,
                });
            } else {
                handleApiError(response, data, `Failed to delete ${fieldName.replace('_document', '')}.`);
            }
        } catch (err) {
            handleNetworkError(err, `Error deleting ${fieldName.replace('_document', '')}.`);
        } finally {
            setCardLoading((prev) => ({ ...prev, [fieldName]: false }));
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

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/vcard',
            ];
            if (!allowedTypes.includes(file.type) && !file.name.endsWith('.vcf')) {
                toast.error('Only JPEG, PNG, GIF, PDF, DOC, DOCX, and VCF files are allowed.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
                return;
            }
            setTempInputData((prev) => ({ ...prev, [name]: file }));
            setEditMode((prev) => ({ ...prev, [name]: true }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'birthday') {
            if (value) {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
            }
        }
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
            'Pet Tag': 'tagCard',
            'Vet Details': 'vetCard',
        };
        const targetId = cardMapping[option];
        if (targetId) {
            setScrollToId(targetId);
            setEditMode((prev) => ({ ...prev, [cardMapping[option]]: true }));
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
                    formData.insurance_expiration ||
                    formData.insurance_document ||
                    tempInputData.insurance_document
                );
            case 'notes':
                return formData.notes;
            case 'birthday':
                return formData.birthday;
            case 'tag_document':
                return (
                    formData.tag_number ||
                    formData.tag_type ||
                    formData.tag_document ||
                    tempInputData.tag_document
                );
            case 'vet_document':
                return (
                    formData.vet_clinic_name ||
                    formData.vet_contact_info ||
                    formData.vaccine_date ||
                    formData.vet_document ||
                    tempInputData.vet_document
                );
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
                'insurance_document',
            ],
            notes: ['notes'],
            birthday: ['birthday'],
            tag_document: ['tag_number', 'tag_type', 'tag_document'],
            vet_document: ['vet_clinic_name', 'vet_contact_info', 'vaccine_date', 'vet_document'],
        };
        return (
            !isCardFilled(fieldName) ||
            (cardFields[fieldName]?.some((key) => tempInputData[key] !== undefined)) ||
            editMode[fieldName]
        );
    };

    const selectStyles = {
        control: (provided) => ({
            ...provided,
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: 'none',
            fontSize: '14px',
            lineHeight: '20px',
            padding: '5px',
            backgroundColor: '#fff',
            '&:hover': {
                border: '1px solid #aaa',
            },
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#f0f0f0' : state.isFocused ? '#e6e6e6' : '#fff',
            color: '#333',
            padding: '10px',
            fontSize: '14px',
            '&:hover': {
                backgroundColor: '#e6e6e6',
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#333',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#999',
        }),
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
                        role="button"
                        aria-label="Birthday card options"
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
                        <label htmlFor="birthday" className="family-detail

-label">Birthday:</label>
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
                            aria-label="Pet birthday"
                        />
                    </div>
                )}
                {showButtons && (
                    <div className="family-detail-button-group">
                        <button
                            type="button"
                            className="family-detail-save-button"
                            onClick={() => handleSaveCard('birthday')}
                            disabled={cardLoading.birthday}
                        >
                            {cardLoading.birthday ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('birthday')}
                            disabled={cardLoading.birthday}
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
        const displayFile = tempInputData.insurance_document || formData.insurance_document;

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
                        role="button"
                        aria-label="Insurance card options"
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
                {displayFile ? (
                    <div className="family-detail-file-container">
                        <img
                            src={getFileIcon(displayFile)}
                            alt="Insurance Icon"
                            className="family-detail-file-icon"
                        />
                        <span
                            className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
                            onClick={() => handlePreview(displayFile)}
                            role="button"
                            aria-label="Preview insurance document"
                        >
                            {typeof displayFile === 'object'
                                ? displayFile.name
                                : displayFile.split('/').pop()}
                        </span>
                        <img
                            src={CrossIcon}
                            alt="Delete Icon"
                            className="family-detail-delete-icon"
                            onClick={() => handleDeleteFile('insurance_document')}
                            role="button"
                            aria-label="Delete insurance document"
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
                            key={fileInputKey}
                            type="file"
                            name="insurance_document"
                            className="family-detail-card-input"
                            onChange={handleFileChange}
                            aria-label="Upload insurance document"
                            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/vcard,.vcf"
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
                                    aria-label="Insurance provider"
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
                                    aria-label="Policy number"
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
                                    aria-label="Policy holder"
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
                                    aria-label="Company name"
                                />
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="agent_contact" className="family-detail-label">Agent Contact:</label>
                                <Select
                                    id="agent_contact"
                                    name="agent_contact"
                                    options={contacts}
                                    value={tempInputData.agent_contact || contacts.find(option => option.value === formData.agent_contact) || null}
                                    onChange={(selected) => setTempInputData((prev) => ({ ...prev, agent_contact: selected }))}
                                    classNamePrefix="react-select"
                                    placeholder="Select Agent Contact"
                                    styles={selectStyles}
                                    isSearchable
                                    aria-label="Agent contact"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="nominee_name" className="family-detail-label">Nominee Name:</label>
                                <Select
                                    id="nominee_name"
                                    name="nominee_name"
                                    options={nominees}
                                    value={tempInputData.nominee_name || nominees.find(option => option.value === formData.nominee_name) || null}
                                    onChange={(selected) => setTempInputData((prev) => ({ ...prev, nominee_name: selected }))}
                                    classNamePrefix="react-select"
                                    placeholder="Select Nominee Name"
                                    styles={selectStyles}
                                    isSearchable
                                    aria-label="Nominee name"
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
                                    aria-label="Insurance issued date"
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
                                    aria-label="Insurance expiration date"
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
                            disabled={cardLoading.insurance_document}
                        >
                            {cardLoading.insurance_document ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('insurance_document')}
                            disabled={cardLoading.insurance_document}
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
                        role="button"
                        aria-label="Notes card options"
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
                        aria-label="Pet notes"
                    />
                )}
                {showButtons && (
                    <div className="family-detail-button-group">
                        <button
                            type="button"
                            className="family-detail-save-button"
                            onClick={() => handleSaveCard('notes')}
                            disabled={cardLoading.notes}
                        >
                            {cardLoading.notes ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('notes')}
                            disabled={cardLoading.notes}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderPetTagCard = () => {
        const isFilled = isCardFilled('tag_document');
        const showButtons = shouldShowButtons('tag_document');
        const displayFile = tempInputData.tag_document || formData.tag_document;

        return (
            <div
                id="card-tag_document"
                className="family-detail-card"
                ref={(el) => (cardRefs.current['tagCard'] = el)}
            >
                <div className="family-detail-card-header">
                    <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                        Pet Tag
                    </label>
                    <span
                        className="family-detail-card-options"
                        onClick={() => toggleOptionsDropdown('tag_document')}
                        role="button"
                        aria-label="Pet Tag card options"
                    >
                        ...
                    </span>
                    {openDropdownId === 'tag_document' && (
                        <div className="family-detail-card-options-dropdown">
                            <div onClick={() => handleEditCard('tag_document')}>Edit</div>
                            <div onClick={() => handleDeleteCard('tag_document')}>Delete</div>
                        </div>
                    )}
                </div>
                {displayFile ? (
                    <div className="family-detail-file-container">
                        <img
                            src={getFileIcon(displayFile)}
                            alt="Tag Icon"
                            className="family-detail-file-icon"
                        />
                        <span
                            className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
                            onClick={() => handlePreview(displayFile)}
                            role="button"
                            aria-label="Preview tag document"
                        >
                            {typeof displayFile === 'object'
                                ? displayFile.name
                                : displayFile.split('/').pop()}
                        </span>
                        <img
                            src={CrossIcon}
                            alt="Delete Icon"
                            className="family-detail-delete-icon"
                            onClick={() => handleDeleteFile('tag_document')}
                            role="button"
                            aria-label="Delete tag document"
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
                            key={fileInputKey}
                            type="file"
                            name="tag_document"
                            className="family-detail-card-input"
                            onChange={handleFileChange}
                            aria-label="Upload tag document"
                            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/vcard,.vcf"
                        />
                    </div>
                )}
                {(isFilled && !editMode.tag_document) ? (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Tag Number:</label>
                                <span className="family-detail-text">{formData.tag_number || 'N/A'}</span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Tag Type:</label>
                                <span className="family-detail-text">{formData.tag_type || 'N/A'}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="tag_number" className="family-detail-label">Tag Number:</label>
                                <input
                                    type="text"
                                    id="tag_number"
                                    name="tag_number"
                                    value={tempInputData.tag_number || formData.tag_number}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                    aria-label="Tag number"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="tag_type" className="family-detail-label">Tag Type:</label>
                                <input
                                    type="text"
                                    id="tag_type"
                                    name="tag_type"
                                    value={tempInputData.tag_type || formData.tag_type}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                    aria-label="Tag type"
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
                            onClick={() => handleSaveCard('tag_document')}
                            disabled={cardLoading.tag_document}
                        >
                            {cardLoading.tag_document ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('tag_document')}
                            disabled={cardLoading.tag_document}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderVetDetailsCard = () => {
        const isFilled = isCardFilled('vet_document');
        const showButtons = shouldShowButtons('vet_document');
        const displayFile = tempInputData.vet_document || formData.vet_document;

        return (
            <div
                id="card-vet_document"
                className="family-detail-card"
                ref={(el) => (cardRefs.current['vetCard'] = el)}
            >
                <div className="family-detail-card-header">
                    <label className={`family-detail-card-label ${isFilled ? 'family-detail-label-filled' : ''}`}>
                        Vet Details
                    </label>
                    <span
                        className="family-detail-card-options"
                        onClick={() => toggleOptionsDropdown('vet_document')}
                        role="button"
                        aria-label="Vet Details card options"
                    >
                        ...
                    </span>
                    {openDropdownId === 'vet_document' && (
                        <div className="family-detail-card-options-dropdown">
                            <div onClick={() => handleEditCard('vet_document')}>Edit</div>
                            <div onClick={() => handleDeleteCard('vet_document')}>Delete</div>
                        </div>
                    )}
                </div>
                {displayFile ? (
                    <div className="family-detail-file-container">
                        <img
                            src={getFileIcon(displayFile)}
                            alt="Vet Icon"
                            className="family-detail-file-icon"
                        />
                        <span
                            className={`family-detail-file-name ${isFilled ? 'family-detail-text-filled' : ''}`}
                            onClick={() => handlePreview(displayFile)}
                            role="button"
                            aria-label="Preview vet document"
                        >
                            {typeof displayFile === 'object'
                                ? displayFile.name
                                : displayFile.split('/').pop()}
                        </span>
                        <img
                            src={CrossIcon}
                            alt="Delete Icon"
                            className="family-detail-delete-icon"
                            onClick={() => handleDeleteFile('vet_document')}
                            role="button"
                            aria-label="Delete vet document"
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
                            key={fileInputKey}
                            type="file"
                            name="vet_document"
                            className="family-detail-card-input"
                            onChange={handleFileChange}
                            aria-label="Upload vet document"
                            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/vcard,.vcf"
                        />
                    </div>
                )}
                {(isFilled && !editMode.vet_document) ? (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Vet Clinic Name:</label>
                                <span className="family-detail-text">{formData.vet_clinic_name || 'N/A'}</span>
                            </div>
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Vet Contact Info:</label>
                                <span className="family-detail-text">{formData.vet_contact_info || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label className="family-detail-label">Vaccine Date:</label>
                                <span className="family-detail-text">
                                    {formData.vaccine_date ? formatDisplayDate(formData.vaccine_date) : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="vet_clinic_name" className="family-detail-label">Vet Clinic Name:</label>
                                <input
                                    type="text"
                                    id="vet_clinic_name"
                                    name="vet_clinic_name"
                                    value={tempInputData.vet_clinic_name || formData.vet_clinic_name}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                    aria-label="Vet clinic name"
                                />
                            </div>
                            <div className="family-detail-input-group">
                                <label htmlFor="vet_contact_info" className="family-detail-label">Vet Contact Info:</label>
                                <input
                                    type="text"
                                    id="vet_contact_info"
                                    name="vet_contact_info"
                                    value={tempInputData.vet_contact_info || formData.vet_contact_info}
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                    aria-label="Vet contact info"
                                />
                            </div>
                        </div>
                        <div className="family-detail-two-column-group">
                            <div className="family-detail-input-group">
                                <label htmlFor="vaccine_date" className="family-detail-label">Vaccine Date:</label>
                                <input
                                    type="date"
                                    id="vaccine_date"
                                    name="vaccine_date"
                                    value={
                                        tempInputData.vaccine_date
                                            ? tempInputData.vaccine_date.split("T")[0]
                                            : formData.vaccine_date
                                                ? formData.vaccine_date.split("T")[0]
                                                : ''
                                    }
                                    onChange={handleInputChange}
                                    className="family-detail-text-input"
                                    aria-label="Vaccine date"
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
                            onClick={() => handleSaveCard('vet_document')}
                            disabled={cardLoading.vet_document}
                        >
                            {cardLoading.vet_document ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            className="family-detail-cancel-button"
                            onClick={() => handleCancelCard('vet_document')}
                            disabled={cardLoading.vet_document}
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
        const fileUrl = typeof previewFile === 'object' ? URL.createObjectURL(previewFile) : `${import.meta.env.VITE_API_URL}${previewFile}`;

        return (
            <div className="family-detail-preview-popup" role="dialog" aria-label="File preview">
                <div className="family-detail-preview-content">
                    <button
                        className="family-detail-preview-close"
                        onClick={closePreview}
                        aria-label="Close preview"
                    >
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
                            aria-label="Add new card"
                        >
                            + Add
                        </button>
                        {showAddDropdown && (
                            <div className="family-detail-add-dropdown">
                                <div onClick={() => handleAddOptionClick('Birthday')}>Birthday</div>
                                <div onClick={() => handleAddOptionClick('Insurance')}>Insurance</div>
                                <div onClick={() => handleAddOptionClick('Notes')}>Notes</div>
                                <div onClick={() => handleAddOptionClick('Pet Tag')}>Pet Tag</div>
                                <div onClick={() => handleAddOptionClick('Vet Details')}>Vet Details</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="family-detail-header">
                <div className="family-detail-info-container">
                    <img
                        src={
                            formData.photo
                                ? `${import.meta.env.VITE_API_URL}${formData.photo.replace(/\\/g, '/')}`
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
                        {renderPetTagCard()}
                        {renderVetDetailsCard()}
                    </div>
                </form>
            </div>
            <PreviewPopup />
        </div>
    );
};

export default PetDetails;
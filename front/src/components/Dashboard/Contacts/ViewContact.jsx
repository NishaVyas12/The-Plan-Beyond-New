import React, { useEffect } from 'react';
import './viewContact.css';
import PhoneIcon from '../../../assets/images/Contact/phone_icon.svg';
import AddressIcon from '../../../assets/images/Contact/map.svg';
import CompanyIcon from '../../../assets/images/Contact/company.png';
import JobIcon from '../../../assets/images/Contact/job.png';
import WebsiteIcon from '../../../assets/images/Contact/job.png';
import EmailIcon from '../../../assets/images/Contact/letter.png';
import CategoryIcon from '../../../assets/images/Contact/relation.png';
import BirthdayIcon from '../../../assets/images/Contact/birthday.png';
import AnniversaryIcon from '../../../assets/images/Contact/celebrate.png';
import EditIcon from '../../../assets/images/dash_icon/edit.svg';
import DeleteIcon from '../../../assets/images/dash_icon/trash.svg';

function ViewContact({ contact, onClose, onEdit, onDelete }) {
    console.log(contact, "CONTACT CONSOLE");
    console.log("Company Name:", contact.company);

    const hasValue = (value) => value !== null && value !== undefined && value !== '';

    const addressComponents = [
        contact.flat_building_no,
        contact.street,
        [contact.country, contact.state, contact.city, contact.postal_code].filter(Boolean).join(', ')
    ].filter(Boolean);
    const fullAddress = addressComponents.length > 0 ? addressComponents.join(' ').trim() : null;

    const hasName = hasValue(contact.first_name) || hasValue(contact.middle_name) || hasValue(contact.last_name);

    // Prepare release_on_pass, share_on, and share_by display
    const shareByMethods = [
        contact.share_by?.whatsapp ? 'WhatsApp' : '',
        contact.share_by?.sms ? 'SMS' : '',
        contact.share_by?.email ? 'Email' : ''
    ].filter(Boolean);
    const releaseOnPassDisplay = contact.release_on_pass === true ? 'Share After Pass' : 'Not Share After Pass';
    const shareDetails = [
        releaseOnPassDisplay,
        contact.share_on,
        ...shareByMethods
    ].filter(Boolean).join('/');

    return (
        <div className="view-contact-drawer-backdrop">
            <div className="view-contact-drawer open" role="dialog" aria-label="View Contact Details">
                <div className="view-contact-drawer-top">
                    <button 
                        className="view-contact-drawer-close" 
                        onClick={onClose} 
                        aria-label="Close contact details"
                    >
                        ×
                    </button>
                </div>
                <div className="view-contact-drawer-divider"></div>
                
                <div className="view-contact-form-content">
                    {(contact.release_on_pass !== undefined || hasValue(contact.share_on) || shareByMethods.length > 0) && (
                        <div className="view-contact-share-details">
                            <div className="view-contact-backend-data">
                                {shareDetails || 'N/A'}
                            </div>
                        </div>
                    )}

                    {hasName && (
                        <div className="view-contact-form-row name-row">
                            <div className="add-contact-profile-image-container">
                                <div className="view-contact-profile-image">
                                    {contact.contact_image ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${contact.contact_image}`}
                                            alt={`${contact.first_name || ''} ${contact.last_name || ''} profile`}
                                            className="view-contact-profile-image-img"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="view-contact-profile-image-placeholder" />
                                    )}
                                </div>
                            </div>
                            <div className="view-contact-backend-data">
                                {contact.first_name || ''} {contact.middle_name || ''} {contact.last_name || ''}
                            </div>
                        </div>
                    )}

                    {(hasValue(contact.phone_number) || hasValue(contact.phone_number1) || hasValue(contact.phone_number2) || hasValue(contact.phone_number3)) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={PhoneIcon} alt="Phone icon" className="view-contact-icon" />
                            </span>
                            <div>
                                <label className="view-contact-form-label">Phone Number</label>
                                {hasValue(contact.phone_number) && (
                                    <div className="view-contact-backend-data view-contact-field-value">{contact.phone_number}</div>
                                )}
                                <div className="view-contact-added-contacts-row">
                                    {contact.phone_number1 && <span className="view-contact-added-contact view-contact-backend-data">{contact.phone_number1}</span>}
                                    {contact.phone_number2 && <span className="view-contact-added-contact view-contact-backend-data">{contact.phone_number2}</span>}
                                    {contact.phone_number3 && <span className="view-contact-added-contact view-contact-backend-data">{contact.phone_number3}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {fullAddress && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={AddressIcon} alt="Address icon" className="view-contact-icon" />
                            </span>
                            <div>
                                <label className="view-contact-form-label">Address</label>
                                <div className="view-contact-backend-data view-contact-field-value">{fullAddress}</div>
                            </div>
                        </div>
                    )}

                    {hasValue(contact.company) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={CompanyIcon} alt="Company icon" className="view-contact-icon" />
                            </span>
                            <div className="view-contact-form-group">
                                <label className="view-contact-form-label">Company Name</label>
                                <div className="view-contact-backend-data">{contact.company}</div>
                            </div>
                        </div>
                    )}

                    {hasValue(contact.job_type) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={JobIcon} alt="Job icon" className="view-contact-icon" />
                            </span>
                            <div className="view-contact-form-group">
                                <label className="view-contact-form-label">Job Title</label>
                                <div className="view-contact-backend-data">{contact.job_type}</div>
                            </div>
                        </div>
                    )}

                    {hasValue(contact.website) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={WebsiteIcon} alt="Website icon" className="view-contact-icon" />
                            </span>
                            <div className="view-contact-form-group">
                                <label className="view-contact-form-label">Website</label>
                                <div className="view-contact-backend-data">{contact.website}</div>
                            </div>
                        </div>
                    )}

                    {hasValue(contact.email) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={EmailIcon} alt="Email icon" className="view-contact-icon" />
                            </span>
                            <div className="view-contact-form-group">
                                <label className="view-contact-form-label">Email</label>
                                <div className="view-contact-backend-data">{contact.email}</div>
                            </div>
                        </div>
                    )}

                    {(hasValue(contact.category) || hasValue(contact.relation)) && (
                        <div className="view-contact-form-row">
                            <span className="view-contact-drawer-icon-circle">
                                <img src={CategoryIcon} alt="Category icon" className="view-contact-icon" />
                            </span>
                            <div className="view-contact-form-group">
                                <label className="view-contact-form-label">Category/Relation</label>
                                <div className="view-contact-backend-data">
                                    {contact.category || ''} {contact.category && contact.relation ? '/' : ''} {contact.relation || ''}
                                </div>
                            </div>
                        </div>
                    )}

                    {(hasValue(contact.date_of_birth) || hasValue(contact.anniversary)) && (
                        <div className="view-contact-reminders-section">
                            <h3 className="view-contact-reminders-heading">Reminders</h3>
                            {hasValue(contact.date_of_birth) && (
                                <div className="view-contact-form-row view-contact-reminder-field">
                                    <span className="view-contact-drawer-icon-circle">
                                        <img src={BirthdayIcon} alt="Birthday icon" className="view-contact-icon" />
                                    </span>
                                    <div className="view-contact-form-group">
                                        <label className="view-contact-form-label">Birthday</label>
                                        <div className="view-contact-backend-data">
                                            {contact.first_name || ''} {contact.middle_name || ''} {contact.last_name || ''} - {contact.date_of_birth}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {hasValue(contact.anniversary) && (
                                <div className="view-contact-form-row view-contact-reminder-field">
                                    <span className="view-contact-drawer-icon-circle">
                                        <img src={AnniversaryIcon} alt="Anniversary icon" className="view-contact-icon" />
                                    </span>
                                    <div className="view-contact-form-group">
                                        <label className="view-contact-form-label">Anniversary</label>
                                        <div className="view-contact-backend-data">
                                            {contact.first_name || ''} {contact.middle_name || ''} {contact.last_name || ''} - {contact.anniversary}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {((contact.uploaded_files || []).length > 0 || (contact.existingFiles || []).length > 0) && (
                        <div className="view-contact-form-row">
                            <div className="view-contact-form-group full-width">
                                <label className="view-contact-form-label">Additional Files</label>
                                <div className="view-contact-file-upload">
                                    {(contact.uploaded_files || []).length > 0 && (
                                        <div className="view-contact-file-preview">
                                            {(contact.uploaded_files || [])
                                                .filter((file) => {
                                                    const ext = file.file_name.split('.').pop().toLowerCase();
                                                    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
                                                    const extensionToMimeType = {
                                                        jpg: 'image/jpeg',
                                                        jpeg: 'image/jpeg',
                                                        png: 'image/png',
                                                        gif: 'image/gif',
                                                    };
                                                    return allowedImageTypes.includes(extensionToMimeType[ext] || '');
                                                })
                                                .map((file) => (
                                                    <div key={file.id} className="view-contact-file-block">
                                                        <div className="view-contact-file-image">
                                                            <img
                                                                src={`${import.meta.env.VITE_API_URL}${file.file_path}`}
                                                                alt={file.file_name}
                                                                className="view-contact-file-preview-img"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <span className="view-contact-file-name view-contact-backend-data">{file.file_name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    {(contact.uploaded_files || []).length === 0 && (
                                        <div className="view-contact-file-dropzone">
                                            <p className="view-contact-upload-desc">No files uploaded</p>
                                        </div>
                                    )}
                                    {(contact.existingFiles || []).length > 0 && (
                                        <div className="view-contact-added-files">
                                            {(contact.existingFiles || []).map((file) => (
                                                <div key={file.id} className="view-contact-file-block">
                                                    <div className="view-contact-file-image view-contact-file-placeholder"></div>
                                                    <span className="view-contact-file-name view-contact-backend-data">{file.file_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="view-contact-button-container">
                        <button 
                            className="view-contact-form-button save" 
                            onClick={() => {
                                onEdit(contact);
                                onClose();
                            }}
                            aria-label="Edit contact"
                        >
                            <img src={EditIcon} alt="Edit icon" className="view-contact-button-icon" />
                            Edit
                        </button>
                        <button 
                            className="view-contact-form-button delete" 
                            onClick={() => {
                                onDelete(contact.id);
                                onClose();
                            }}
                            aria-label="Delete contact"
                        >
                            <img src={DeleteIcon} alt="Delete icon" className="view-contact-button-icon" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewContact;
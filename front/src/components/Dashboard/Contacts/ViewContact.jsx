import React from 'react';

function ViewContact({ contact, onClose }) {
    console.log(contact, "CONTACT ONSOLE")
    return (
        <div className="add-contact-modal-backdrop">
            <div className="add-contact-modal add-contact-custom-form">
                <button className="add-contact-modal-close" onClick={onClose}>
                    ×
                </button>
                <div className="add-contact-modal-header">
                    <h2 className="add-contact-custom-heading">View Contact</h2>
                    <div className="add-contact-profile-image-container">
                        <div className="add-contact-profile-image">
                            {contact.contact_image ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL}${contact.contact_image}`}
                                    alt="Profile"
                                    className="add-contact-profile-image-img"
                                />
                            ) : (
                                <div className="add-contact-profile-image-placeholder" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="add-contact-form-content">
                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">First Name</label>
                            <div className="add-contact-form-input">{contact.first_name || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Middle Name</label>
                            <div className="add-contact-form-input">{contact.middle_name || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Last Name</label>
                            <div className="add-contact-form-input">{contact.last_name || '-'}</div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Company</label>
                            <div className="add-contact-form-input">{contact.company || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Job Type</label>
                            <div className="add-contact-form-input">{contact.job_type || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Website</label>
                            <div className="add-contact-form-input">{contact.website || '-'}</div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Category</label>
                            <div className="add-contact-form-input">{contact.category || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Relation</label>
                            <div className="add-contact-form-input">{contact.relation || '-'}</div>
                        </div>
                        <div className="add-contact-form-group phone-group">
                            <label className="add-contact-form-label">Phone Number</label>
                            <div className="phone-input-row">
                                <div className="add-contact-form-input">{contact.phone_number || '-'}</div>
                            </div>
                            <div className="added-contacts-row">
                                {contact.phone_number1 && (
                                    <span className="added-contact">{contact.phone_number1}</span>
                                )}
                                {contact.phone_number2 && (
                                    <span className="added-contact">{contact.phone_number2}</span>
                                )}
                                {contact.phone_number3 && (
                                    <span className="added-contact">{contact.phone_number3}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Email</label>
                            <div className="add-contact-form-input">{contact.email || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Flat/Building No</label>
                            <div className="add-contact-form-input">{contact.flat_building_no || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Street</label>
                            <div className="add-contact-form-input">{contact.street || '-'}</div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Country</label>
                            <div className="add-contact-form-input">{contact.country || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">State</label>
                            <div className="add-contact-form-input">{contact.state || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">City</label>
                            <div className="add-contact-form-input">{contact.city || '-'}</div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Postal Code</label>
                            <div className="add-contact-form-input">{contact.postal_code || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Date of Birth</label>
                            <div className="add-contact-form-input">{contact.date_of_birth || '-'}</div>
                        </div>
                        <div className="add-contact-form-group">
                            <label className="add-contact-form-label">Anniversary</label>
                            <div className="add-contact-form-input">{contact.anniversary || '-'}</div>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group full-width">
                            <label className="add-contact-form-label">Notes</label>
                            <div className="add-contact-form-input">{contact.notes || '-'}</div>
                            <label className="add-contact-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={contact.release_on_pass || false}
                                    disabled
                                />
                                Information is released when one passes away
                            </label>
                        </div>
                    </div>

                    <div className="add-contact-form-row">
                        <div className="add-contact-form-group full-width">
                            <label className="add-contact-form-label">Additional Files</label>
                            <div className="add-contact-file-upload">
                                {contact.uploaded_files.length > 0 ? (
                                    <div className="add-contact-file-preview">
                                        {contact.uploaded_files
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
                                                <div key={file.id} className="add-contact-file-preview-item">
                                                    <img
                                                        src={`${import.meta.env.VITE_API_URL}${file.file_path}`}
                                                        alt={file.file_name}
                                                        className="add-contact-file-preview-img"
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="add-contact-file-dropzone">
                                        <p className="add-contact-upload-desc">No files uploaded</p>
                                    </div>
                                )}
                                {contact.existingFiles && contact.existingFiles.length > 0 && (
                                    <div className="added-files">
                                        {contact.existingFiles.map((file) => (
                                            <div key={file.id} className="added-file">
                                                <span>{file.file_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="add-contact-form-actions">
                        <button className="add-contact-form-button cancel" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewContact;
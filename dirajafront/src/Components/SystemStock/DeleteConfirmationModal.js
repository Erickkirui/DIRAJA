import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Deletion</h2>
                <p>Are you sure you want to delete the selected shop stocks?</p>
                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="confirm-button" onClick={onConfirm}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

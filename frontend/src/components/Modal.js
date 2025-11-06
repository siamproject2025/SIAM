import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-matriculas" onClick={onClose}>
      <div className="modal-content-matriculas" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-matriculas">
          <h2 className="modal-title-matriculas">{title}</h2>
          <button className="modal-close-matriculas" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body-matriculas">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmDialog.css';

const ConfirmDialog = ({ message, onConfirm, onCancel, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="confirm-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="confirm-dialog"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <p className="confirm-message">{message}</p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-yes" onClick={onConfirm}>Sí</button>
              <button className="confirm-btn confirm-no" onClick={onCancel}>No</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;

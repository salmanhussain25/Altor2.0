import React, { useState, useEffect } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  courseName: string;
  isLoading: boolean;
  error: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseName,
  isLoading,
  error,
}) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
    // Reset PIN when modal is opened or closed
    if (!isOpen) {
      setTimeout(() => setPin(''), 300);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (pin.length === 4 && !isLoading) {
      onConfirm(pin);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl w-full max-w-md transform transition-all duration-300 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center text-white mb-2">Delete Course</h2>
        <p className="text-center text-gray-400 mb-6">
          Are you sure you want to delete the course{' '}
          <span className="font-bold text-purple-400">{courseName}</span>? This action cannot be undone.
        </p>
        <p className="text-center text-yellow-400 text-sm mb-6 bg-yellow-900/50 p-3 rounded-lg">
            Note: Your certificates and badges for this course will not be deleted.
        </p>

        <div className="flex flex-col items-center mb-6">
            <label htmlFor="pin-input" className="text-gray-300 mb-2">Enter your 4-digit PIN to confirm:</label>
            <input
                id="pin-input"
                type="password"
                value={pin}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 4) {
                        setPin(val);
                    }
                }}
                maxLength={4}
                className="w-48 text-center bg-gray-900 border-2 border-gray-700 rounded-lg py-2 text-2xl tracking-[1em] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                autoFocus
            />
        </div>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || pin.length !== 4}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
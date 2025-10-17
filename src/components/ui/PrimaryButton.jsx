import React from 'react';

const PrimaryButton = ({ children, className = '', disabled = false, onClick, type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className={`btn btn-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
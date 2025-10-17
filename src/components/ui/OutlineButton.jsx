import React from 'react';

const OutlineButton = ({ children, className = '', disabled = false, onClick, type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className={`btn btn-outline ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default OutlineButton;
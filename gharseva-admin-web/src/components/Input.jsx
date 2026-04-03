import React from 'react';
import './Input.css';

const Input = ({ label, error, ...props }) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className={error ? 'error' : ''} {...props} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default Input;

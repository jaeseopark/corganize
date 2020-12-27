/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';

const Button = ({ className, ...props }) => {
  return (
    <button
      type="button"
      className={className || 'btn btn-primary'}
      {...props}
    />
  );
};

export const LightButton = ({ className, ...props }) => {
  const newClassName = `${className || ''} btn btn-light`;
  return <Button {...props} className={newClassName} />;
};

export const SuccessButton = ({ className, ...props }) => {
  const newClassName = `${className || ''} btn btn-success`;
  return <Button {...props} className={newClassName} />;
};

export default Button;

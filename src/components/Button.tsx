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

export const LightButton = (props) => (
  <Button className="btn btn-light" {...props} />
);

export const SuccessButton = (props) => (
  <Button className="btn btn-success" {...props} />
);

export default Button;

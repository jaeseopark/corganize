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

const ButtonClassOverride = ({ props, classOverride }) => {
  const { className, ...remainingProps } = props;
  const newClassName = `${className || ''} ${classOverride}`;
  return <Button {...remainingProps} className={newClassName} />;
};

export const LightButton = (props) => (
  <ButtonClassOverride props={props} classOverride="btn btn-light" />
);

export const SuccessButton = (props) => (
  <ButtonClassOverride props={props} classOverride="btn btn-success" />
);

export default Button;

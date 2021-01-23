/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react';
import classNames from 'classnames';

const ButtonClassOverride = ({ props, classOverride }) => {
  const { className, ...remainingProps } = props;
  const newClassName = classNames(className, classOverride);
  return <button type="button" className={newClassName} {...remainingProps} />;
};

const Button = (props) => {
  return <ButtonClassOverride props={props} classOverride="btn btn-primary" />;
};

export const LightButton = (props) => (
  <ButtonClassOverride props={props} classOverride="btn btn-light" />
);

export const SuccessButton = (props) => (
  <ButtonClassOverride props={props} classOverride="btn btn-success" />
);

export default Button;

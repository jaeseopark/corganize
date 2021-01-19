/* eslint-disable react/prop-types */
import React from 'react';

const FullscreenView = ({ onClose, title, content }) => (
  <div>
    <div className="modal-header">
      <h5 className="modal-title">{title}</h5>
      <button
        type="button"
        className="close"
        data-dismiss="modal"
        aria-label="Close"
        onClick={onClose}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div className="modal-body">{content}</div>
  </div>
);

export default FullscreenView;

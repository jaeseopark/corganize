/* eslint-disable react/prop-types */
import React from 'react';

type FullscreenComponent = {
  title: string;
  body: HTMLElement;
};

type FullscreenViewProps = {
  onClose: Function;
  fullscreenComponent: FullscreenComponent | null;
};

const FullscreenView = ({
  onClose,
  fullscreenComponent,
}: FullscreenViewProps) => {
  const { title, body } = fullscreenComponent;

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key === 'q') {
      onClose();
    }
  };

  return (
    <div className="fullscreenview" onKeyUp={onKeyUp}>
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
      <div className="modal-body">{body}</div>
    </div>
  );
};

export default FullscreenView;

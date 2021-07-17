/* eslint-disable react/prop-types */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFullscreennPayload,
  unsetFullscreen,
} from '../redux/fullscreen/slice';

type FullscreenViewProps = {
  onClose: () => void;
};

const FullscreenView = ({ onClose }: FullscreenViewProps) => {
  const dispatch = useDispatch();
  const fullscreenComponent = useSelector(getFullscreennPayload);
  const { title, body } = fullscreenComponent;

  const onCloseWrapper = () => {
    onClose();
    dispatch(unsetFullscreen());
  };

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key === 'q') onCloseWrapper();
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
          onClick={onCloseWrapper}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="modal-body">{body}</div>
    </div>
  );
};

export default FullscreenView;

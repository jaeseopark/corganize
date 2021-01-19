import { readdirSync } from 'fs';
import React, { useEffect, useState } from 'react';
import Carousel, { Modal, ModalGateway } from 'react-images';
import Button from './Button';

import './ZipViewer.scss';
import ZipViewerHotkeyHelper from './ZipViewerHotkeyHelper';

const { join } = require('path');

const AdmZip = require('adm-zip');

const ZipViewer = ({ path }) => {
  const [images, setImages] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const dir = `${path}.deflated`;

    try {
      const zip = new AdmZip(path);
      zip.extractAllTo(dir);
    } catch (e) {
      setErrorMessage(e.message);
      return;
    }

    const imgs = readdirSync(dir).map((filename) => {
      const fullPath = join(dir, filename);
      return {
        source: `file://${fullPath}`,
        caption: filename,
      };
    });

    setImages(imgs);
  }, [path]);

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  if (!images) {
    return null;
  }

  const setCurrentIndexWithBounds = (newIndex) => {
    if (newIndex < 0) {
      setCurrentIndex(0);
    } else if (newIndex >= images.length) {
      setCurrentIndex(images.length - 1);
    } else {
      setCurrentIndex(newIndex);
    }
  };

  const onKeyUp = ({ key }) => {
    switch (key) {
      case 'z':
        setCurrentIndexWithBounds(currentIndex - 5);
        break;
      case 'x':
        setCurrentIndexWithBounds(currentIndex - 1);
        break;
      case 'c':
        setCurrentIndexWithBounds(currentIndex + 1);
        break;
      case 'v':
        setCurrentIndexWithBounds(currentIndex + 5);
        break;
      case '[':
        setCurrentIndex(0);
        break;
      case ']':
        setCurrentIndex(images.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="zip-viewer" onKeyUp={onKeyUp}>
      <ModalGateway>
        {modalIsOpen && (
          <Modal onClose={() => setModalIsOpen(!modalIsOpen)}>
            <Carousel views={images} currentIndex={currentIndex} />
          </Modal>
        )}
      </ModalGateway>
      <Button onClick={() => setModalIsOpen(true)}>Open Lightbox</Button>
      <ZipViewerHotkeyHelper />
    </div>
  );
};

export default ZipViewer;

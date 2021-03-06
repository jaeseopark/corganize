import React, { useEffect, useState } from 'react';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { listDirAsync } from '../utils/fileUtils';
import Button from './Button';

import './ZipView.scss';
import ZipViewHotkeyHelper from './ZipViewHotkeyHelper';

const AdmZip = require('adm-zip');

const ZipView = ({ path }) => {
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

    listDirAsync(dir, true)
      .then((fullPaths) => {
        return fullPaths.map((fullPath: string) => {
          const img = { source: `file://${fullPath}` };
          return img;
        });
      })
      .then((imgs) => setImages(imgs))
      .catch(setErrorMessage);
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
        setCurrentIndexWithBounds(currentIndex - 10);
        break;
      case 'x':
        setCurrentIndexWithBounds(currentIndex - 5);
        break;
      case 'c':
        setCurrentIndexWithBounds(currentIndex + 5);
        break;
      case 'v':
        setCurrentIndexWithBounds(currentIndex + 10);
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

  const trackProps = {
    onViewChange: (newIndex) => setCurrentIndex(newIndex),
  };

  return (
    <div className="zip-view" onKeyUp={onKeyUp}>
      <ModalGateway>
        {modalIsOpen && (
          <Modal onClose={() => setModalIsOpen(!modalIsOpen)}>
            <Carousel
              views={images}
              currentIndex={currentIndex}
              trackProps={trackProps}
            />
          </Modal>
        )}
      </ModalGateway>
      <Button onClick={() => setModalIsOpen(true)}>Open Lightbox</Button>
      <ZipViewHotkeyHelper />
    </div>
  );
};

export default ZipView;

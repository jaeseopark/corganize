/* eslint-disable radix */
import React, { useEffect, useRef, useState } from 'react';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { listDirAsync } from '../utils/fsUtils';
import Button from './Button';

import './ZipView.scss';
import ZipViewHotkeyHelper from './ZipViewHotkeyHelper';

const AdmZip = require('adm-zip');

type Image = {
  source: string;
};

const ZipView = ({ path }: { path: string }) => {
  const [images, setImages] = useState<Image[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const errorRef = useRef(null);

  useEffect(() => {
    if (!images && !errorMessage) {
      const dir = `${path}.deflated`;

      try {
        const zip = new AdmZip(path);
        zip.extractAllTo(dir);
      } catch (e) {
        setErrorMessage(e.message);
        return;
      }

      listDirAsync(dir, true)
        .then((fullPaths: string[]) => {
          return fullPaths.map((fullPath: string) => {
            const img = { source: `file://${fullPath}` };
            return img;
          });
        })
        .then(setImages)
        .catch(setErrorMessage);
    }

    if (errorRef?.current) {
      errorRef?.current.focus();
    }
  }, [errorMessage, images, path, setImages]);

  const setCurrentIndexWithBounds = (newIndex: number) => {
    if (newIndex < 0) {
      setCurrentIndex(0);
    } else if (newIndex >= images.length) {
      setCurrentIndex(images.length - 1);
    } else {
      setCurrentIndex(newIndex);
    }
  };

  const onKeyUp = (event) => {
    const key = event.key.toLowerCase();
    if (key >= '0' && key <= '9') {
      const i = Math.floor((images?.length * parseInt(key)) / 10);
      setCurrentIndexWithBounds(i);
    } else if (key === 'z') {
      setCurrentIndexWithBounds(currentIndex - 10);
    } else if (key === 'x') {
      setCurrentIndexWithBounds(currentIndex - 5);
    } else if (key === 'arrowleft') {
      setCurrentIndexWithBounds(currentIndex - 1);
    } else if (key === 'arrowright' || key === ' ') {
      setCurrentIndexWithBounds(currentIndex + 1);
    } else if (key === 'c') {
      setCurrentIndexWithBounds(currentIndex + 5);
    } else if (key === 'v') {
      setCurrentIndexWithBounds(currentIndex + 10);
    } else if (key === '[') {
      setCurrentIndex(0);
    } else if (key === ']') {
      setCurrentIndex(images.length - 1);
    }
  };

  if (errorMessage) {
    return <p tabIndex="1" ref={errorRef}>{errorMessage}</p>;
  }

  if (!images) {
    return null;
  }

  // Note: this component gets rendered right inside <body>
  const getFullscreenModal = () => (
    <ModalGateway>
      {modalIsOpen && (
        <Modal onClose={() => setModalIsOpen(!modalIsOpen)}>
          <Carousel
            views={images}
            currentIndex={currentIndex}
            trackProps={{
              onViewChange: (newIndex: number) => setCurrentIndex(newIndex),
            }}
            frameProps={{ accessibility: false }}
          />
        </Modal>
      )}
    </ModalGateway>
  );

  return (
    <div className="zip-view" onKeyUp={onKeyUp}>
      {getFullscreenModal()}
      <Button onClick={() => setModalIsOpen(true)}>Open Lightbox</Button>
      <ZipViewHotkeyHelper />
    </div>
  );
};

export default ZipView;

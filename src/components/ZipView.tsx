import React, { useEffect, useRef, useState } from 'react';
import Carousel, { Modal, ModalGateway } from 'react-images';
import { listDirAsync } from '../utils/fileUtils';
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
        .then((imgs: Image[]) => setImages(imgs))
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

  const onKeyUp = ({ key }: { key: string }) => {
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

  if (errorMessage) {
    return <p tabIndex="1" ref={errorRef}>{errorMessage}</p>;
  }

  if (!images) {
    return null;
  }

  return (
    <div className="zip-view" onKeyUp={onKeyUp}>
      <ModalGateway>
        {modalIsOpen && (
          <Modal onClose={() => setModalIsOpen(!modalIsOpen)}>
            <Carousel
              views={images}
              currentIndex={currentIndex}
              trackProps={{
                onViewChange: (newIndex: number) => setCurrentIndex(newIndex),
              }}
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

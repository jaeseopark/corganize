import { readdirSync } from 'fs';
import React, { useEffect, useState } from 'react';
import Carousel, { Modal, ModalGateway } from 'react-images';
import Button from './Button';

import './ZipViewer.scss';

const { join } = require('path');

const AdmZip = require('adm-zip');

const ZipViewer = ({ path }) => {
  const [images, setImages] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(true);

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

  return (
    <div className="zip-viewer">
      <ModalGateway>
        {modalIsOpen && (
          <Modal onClose={() => setModalIsOpen(!modalIsOpen)}>
            <Carousel views={images} />
          </Modal>
        )}
      </ModalGateway>
      <Button onClick={() => setModalIsOpen(true)}>Open Lightbox</Button>
    </div>
  );
};

export default ZipViewer;

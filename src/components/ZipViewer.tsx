import { readdirSync } from 'fs';
import React, { useEffect, useState } from 'react';
import Gallery from 'react-grid-gallery';

import './ZipViewer.scss';

const { join } = require('path');

const AdmZip = require('adm-zip');

const ZipViewer = ({ path }) => {
  const [images, setImages] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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
        src: `file://${fullPath}`,
        thumbnail: `file://${fullPath}`,
        thumbnailWidth: 0,
        thumbnailHeight: 0,
        caption: filename,
      };
    });

    imgs[0].isSelected = true;

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
      <Gallery images={images} isOpen />
    </div>
  );
};

export default ZipViewer;

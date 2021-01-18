import React from 'react';

const AdmZip = require('adm-zip');

const ZipViewer = ({ path }) => {
  const zip = new AdmZip(path);
  const defaltedPath = `${path}.deflated`;

  zip.extractAllTo(defaltedPath);

  return <h1>hello</h1>;
};

export default ZipViewer;

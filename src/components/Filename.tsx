import React from 'react';
import format from '../cellformatter';
import FileMetadataView from './FileMetadataView';

const Filename = ({ row, column, value, setFullscreenComponent }) => {
  const { original: file } = row;
  const { mimetype: mt, filename } = file;

  return (
    <>
      {mt && <div className={`${mt.replace('/', '-')} icon mimetype`} />}
      <textarea
        readOnly
        tabIndex="-1"
        role="button"
        onClick={() => {
          setFullscreenComponent({
            title: filename,
            body: <FileMetadataView file={file} />,
          });
        }}
        value={format({ column, value })}
      />
    </>
  );
};

export default Filename;

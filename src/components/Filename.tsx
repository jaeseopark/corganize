import React from 'react';
import format from '../cellformatter';

const Filename = ({ row, column, value, setFullscreenComponent }) => {
  const { mimetype } = row.original;
  const icon = mimetype && (
    <div className={`${mimetype.replace('/', '-')} icon mimetype`} />
  );

  return (
    <>
      {icon}
      <textarea
        readOnly
        tabIndex="-1"
        role="button"
        onClick={() => {
          setFullscreenComponent({
            title: row.original.filename,
            body: <pre>{JSON.stringify(row.original, null, 2)}</pre>,
          });
        }}
        value={format({ column, value })}
      />
    </>
  );
};

export default Filename;

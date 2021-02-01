import React from 'react';
import format from '../cellformatter';

const Filename = ({ row, column, value }) => {
  const { mimetype: mt } = row.original;
  return (
    <>
      {mt && <div className={`${mt.replace('/', '-')} icon mimetype`} />}
      <textarea
        className="filename"
        readOnly
        tabIndex="-1"
        value={format({ column, value })}
      />
    </>
  );
};

export default Filename;

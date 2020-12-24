/* eslint-disable no-case-declarations */
import React from 'react';
import dayjs from 'dayjs';

import { humanFileSize } from './utils/numberUtils';

const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(relativeTime);

export default function format(props) {
  const { value, column } = props;
  switch (column.id) {
    case 'size':
      return value ? <div className="size">{humanFileSize(value)}</div> : null;
    case 'lastupdated': {
      // const date = new Date(value * 1000);
      // const dateISO = date.toISOString().split('T')[0];
      const relativeString = dayjs()
        .to(dayjs.unix(value))
        .split('ago')[0]
        .trim();
      return relativeString;
    }
    case 'filename': {
      const sourceurl = props?.row?.values?.sourceurl;
      if (sourceurl) {
        return (
          <>
            {value}{' '}
            <a href={sourceurl} target="_blank" rel="noreferrer">
              source
            </a>
          </>
        );
      }
      return value;
    }
    case 'ispublic':
    case 'isactive': {
      const classNames = `${String(!!value)} icon`;
      return <div className={classNames} />;
    }
    case 'storageservice': {
      const classNames = `${String(value)} icon`;
      return <div className={classNames} />;
    }
    default:
      return String(value);
  }
}

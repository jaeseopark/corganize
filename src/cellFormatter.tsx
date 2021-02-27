/* eslint-disable no-case-declarations */
import React from 'react';
import dayjs from 'dayjs';

import { humanFileSize } from './utils/numberUtils';
import { htmlDecode } from './utils/stringUtils';

const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(relativeTime);

export default function format(props) {
  const { value, column } = props;
  switch (column.id) {
    case 'size':
      return value ? <div className="size">{humanFileSize(value)}</div> : null;
    case 'lastupdated': {
      const relativeString = dayjs()
        .to(dayjs.unix(value))
        .split('ago')[0]
        .trim();
      return relativeString;
    }
    case 'dateactivated':
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
      return htmlDecode(String(value));
  }
}

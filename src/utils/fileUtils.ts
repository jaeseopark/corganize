const path = require('path');

const SUPPORTED_IN_APP_FILE_TYPE = ['mp4'];

export const getExtnameWithoutDot = (
  filename: string,
  defaultExtname: string
) => {
  return (path.extname(filename) || defaultExtname).replace('.', '');
};

export const isSupportedInAppFileType = (ext) => {
  return SUPPORTED_IN_APP_FILE_TYPE.includes(ext);
};

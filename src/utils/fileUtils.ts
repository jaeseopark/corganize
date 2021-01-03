const path = require('path');

const SUPPORTED_IN_APP_FILE_TYPE = ['mp4'];

export const getExtnameFromFile = (filename: string, defaultExtname: string) => {
  const ext = path.extname(filename);
  return ext || defaultExtname;
};

export const isSupportedInAppFileType = (ext) => {
  return SUPPORTED_IN_APP_FILE_TYPE.includes(ext);
};

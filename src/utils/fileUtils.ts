const path = require('path');

const SUPPORTED_IN_APP_FILE_TYPE = ['mp4'];

export const getExtnameWithoutDotOrDefault = (
  filename: string,
  defaultExtname: string
) => {
  const ext = (path.extname(filename) || '').replace('.', '');
  if (!SUPPORTED_IN_APP_FILE_TYPE.includes(ext)) {
    return defaultExtname;
  }
  return ext;
};

export const isSupportedInAppFileType = (ext) => {
  return SUPPORTED_IN_APP_FILE_TYPE.includes(ext);
};

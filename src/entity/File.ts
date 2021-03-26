export type File = {
  // Mandatory fields
  fileid: string;
  sourceurl: string;
  lastupdated: number;
  filename: string;

  // Optional fields
  dateactivated?: number;
  storageservice?: string;
  locationref?: string;
  size?: number;
  mimetype?: string;

  // Decorative/local fields
  encryptedPath: string;
  decryptedPath: string;
};

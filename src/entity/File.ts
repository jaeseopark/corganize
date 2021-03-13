export type File = {
  // Mandatory fields
  fileid: string;
  sourceurl: string;
  lastupdated: number;

  // Optional fields
  dateactivated?: number;
  storageservice?: string;
  locationref?: string;
  size?: number;

  // Decorative/local fields
  encryptedPath: string;
};

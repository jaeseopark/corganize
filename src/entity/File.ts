export type File = {
  // Mandatory fields
  fileid: string;
  sourceurl: string;
  lastupdated: number;
  filename: string;

  // Optional fields (still server-side)
  dateactivated?: number;
  storageservice?: string;
  locationref?: string;
  size?: number;
  mimetype?: string;

  // UI-only fields
  encryptedPath: string;
  decryptedPath: string;
  thumbnailurl?: string;
};

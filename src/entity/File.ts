export type File = {
  fileid: string;
  storageservice: string | null | undefined;
  encryptedPath: string;
  sourceurl: string;
  dateactivated: number | null | undefined;
};

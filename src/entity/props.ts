export type CorganizeClientProps = {
  host: string;
  apikey: string;
};

export type HypersquirrelClientProps = {
  host: string;
};

export type GdriveClientProps = {
  creds: {
    path: string;
  };
  upload: {
    folder: string;
  };
};

export type LibraryConfig = {
  server: CorganizeClientProps;
  hypersquirrel: {
    remote: HypersquirrelClientProps;
    preset: string[];
  };
  storageservice: {
    gdrive: GdriveClientProps;
  };
  local: {
    path: string;
    tmpPath?: string;
  };
};

export type ContextMenuOption = {
  label: string;
  onClick: Function;
  hotkey?: string;
};

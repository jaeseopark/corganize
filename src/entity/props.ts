export type CorganizeClientProps = {
  host: string;
  apikey: string;
};

export type HypersquirrelClientProps = {
  host: string;
};

export type ContextMenuOption = {
  label: string;
  onClick: Function;
  hotkey?: string;
};

import TableView from "@/components/config/table";

const PresetTableView = ({ presets, ...rest }: { presets: any[] }) => (
  <TableView items={presets} nameProvider={(preset) => preset.preset_name} {...rest} />
);

export default PresetTableView;

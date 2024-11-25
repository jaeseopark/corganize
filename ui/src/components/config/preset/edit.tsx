import { Box, Button } from "@chakra-ui/react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { useRef, useState } from "preact/hooks";

import "jsoneditor-react/es/editor.min.css";

type EditProps = { preset: any; onSave: (any) => void; onCancel: () => void; onDelete: () => void };

const PresetEditView = ({ preset, onSave, onCancel: handleCancel, onDelete: handleDelete }: EditProps) => {
  const jsonRef = useRef(preset);

  const handleChange = (updatedPreset) => {
    jsonRef.current = updatedPreset;
  };

  const handleSave = () => {
    onSave(jsonRef.current);
  };

  if (!preset) {
    return null;
  }

  return (
    <Box>
      <Editor value={preset} onChange={handleChange} />
      <Button onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleDelete}>Delete</Button>
      <Button onClick={handleSave}>Save</Button>
    </Box>
  );
};

export default PresetEditView;

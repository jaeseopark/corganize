import { Box, Button, Flex, Span, VStack } from "@chakra-ui/react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { useRef } from "preact/hooks";

type EditProps = {
  preset: any;
  templates: { [key: string]: any };
  onSave: (any) => void;
  onCancel: () => void;
  onDelete: () => void;
};

const PresetEditView = ({ preset, templates, onSave, onCancel: handleCancel, onDelete: handleDelete }: EditProps) => {
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
    <VStack>
      <Box width="100%">
        <Editor value={preset} onChange={handleChange} />
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleDelete}>Delete</Button>
        <Button onClick={handleSave}>Save</Button>
      </Box>
      <Flex gap="4" wrap="wrap" maxW="100%">
        {Object.keys(templates).map((name) => (
          <Span key={name}>{name}</Span>
        ))}
      </Flex>
    </VStack>
  );
};

export default PresetEditView;

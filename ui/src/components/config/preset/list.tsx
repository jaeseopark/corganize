import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { Box, Button, HStack, ProgressLabel, ProgressValueText, Table } from "@chakra-ui/react";

const PresetListView = ({ presets, setEditIndex }: { presets: any[]; setEditIndex: (number) => void }) => {
  const sumW = presets.reduce((acc, next) => {
    return acc + (next.weight || 1);
  }, 0);

  const getWeightPercStr = (w: number) => {
    return ((w * 100) / sumW).toFixed(1);
  };

  return (
    <Box padding="4em">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Weight</Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Model</Table.ColumnHeader>
            <Table.ColumnHeader>Non-LoRA Templates</Table.ColumnHeader>
            <Table.ColumnHeader>Notes</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {presets.map((p, i) => {
            const w = p.weight || 1;
            return (
              <Table.Row>
                <Table.Cell>
                  <ProgressRoot defaultValue={0} value={(w * 100) / sumW} maxW="150px">
                    <HStack gap="5">
                      <ProgressLabel>{w}</ProgressLabel>
                      <ProgressBar flex="1" />
                      <ProgressValueText>{getWeightPercStr(w)} %</ProgressValueText>
                    </HStack>
                  </ProgressRoot>
                </Table.Cell>
                <Table.Cell>
                  <Button size="xs" padding="0.4em" onClick={() => setEditIndex(i)}>
                    {p.preset_name}
                  </Button>
                </Table.Cell>
                <Table.Cell className="monospace">{p.model}</Table.Cell>
                <Table.Cell>{(p.templates || []).filter((t) => !t.includes("lora"))}</Table.Cell>
                <Table.Cell>{p.notes}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>{sumW}</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Box>
  );
};

export default PresetListView;

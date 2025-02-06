import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { getAveragePropertyValue } from "@/utils";
import { Box, Button, HStack, ProgressLabel, ProgressValueText, Table } from "@chakra-ui/react";

const TableView = ({
  items,
  setEditIndex,
  nameProvider,
  showWeightPerc,
}: {
  items: any[];
  setEditIndex: (number) => void;
  nameProvider: (any) => string;
  showWeightPerc: boolean | undefined;
}) => {
  const sumW = items.reduce((acc, next) => {
    if (next.weight === 0) {
      // if the weight is explicitly 0, then skip it over.
      return acc;
    }
    return acc + (next.weight || 1);
  }, 0);

  const getWeightPercStr = (w: number) => {
    return ((w * 100) / sumW).toFixed(1);
  };

  return (
    <Box>
      <Table.Root className="small">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{(showWeightPerc && `Weight (Sum: ${sumW})`) || "Weight"}</Table.ColumnHeader>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Model</Table.ColumnHeader>
            <Table.ColumnHeader>Templates</Table.ColumnHeader>
            <Table.ColumnHeader>Loras</Table.ColumnHeader>
            <Table.ColumnHeader>Notes</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item, i) => {
            const w = item.weight === 0 ? 0 : item.weight || 1;
            return (
              <Table.Row className={w === 0 && "ignored"}>
                <Table.Cell>
                  {(() => {
                    if (!showWeightPerc) {
                      return w;
                    }
                    return (
                      <ProgressRoot defaultValue={0} value={(w * 100) / sumW} minW="150px" maxW="150px">
                        <HStack gap="5">
                          <ProgressLabel>{w}</ProgressLabel>
                          <ProgressBar flex="1" />
                          <ProgressValueText>{getWeightPercStr(w)} %</ProgressValueText>
                        </HStack>
                      </ProgressRoot>
                    );
                  })()}
                </Table.Cell>
                <Table.Cell>
                  <Button size="xs" padding="0.4em" onClick={() => setEditIndex(i)}>
                    {nameProvider(item)}
                  </Button>
                </Table.Cell>
                <Table.Cell className="monospace">
                  {(item.model || "").split("|").map((m) => (
                    <div key={m}>{m}</div>
                  ))}
                </Table.Cell>
                <Table.Cell className="monospace">
                  {(() => {
                    const templates = item.templates || [];
                    if (Array.isArray(templates)) {
                      return templates.map((template) => {
                        if (typeof template === "string") {
                          return (
                            <Box key={template} className="template-name">
                              {template}
                            </Box>
                          );
                        }
                      });
                    }
                    return <Box className="template-name">[Object]</Box>;
                  })()}
                </Table.Cell>
                <Table.Cell>
                  {(item.loras || []).map((lora: { one_of: any; alias: string; weight: number | number[] }) => {
                    const { alias, weight, one_of } = lora;
                    if (!one_of) {
                      const weightStr = typeof weight === "number" ? weight.toFixed(0.2) : weight.join("-");
                      return (
                        <div key={alias} className="monospace">
                          {alias}:{weightStr}
                        </div>
                      );
                    }
                    return (
                      <div key={JSON.stringify(lora)} className="monospace">
                        [Object]
                      </div>
                    );
                  })}
                </Table.Cell>
                <Table.Cell>{JSON.stringify(item.notes)}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default TableView;

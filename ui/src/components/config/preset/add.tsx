import { Button } from "@/components/ui/button";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@chakra-ui/react";

const AddDialog = ({
  presets,
  isOpen,
  onCancel: handleCancel,
  onAdd,
}: {
  presets: any[];
  isOpen: boolean;
  onCancel: () => void;
  onAdd: (i: number) => void;
}) => {
  return (
    <DialogRoot placement={"center"} motionPreset="slide-in-bottom" lazyMount open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Select>
            {[
              {
                preset_name: "(Start New)",
              },
              ...presets,
            ].map(({ preset_name }, i) => {
              return <option key={preset_name} value={i} label={preset_name} />;
            })}
          </Select>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button>Save</Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};

export default AddDialog;

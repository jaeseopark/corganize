import { axios } from "@/api";
import AddDialog from "@/components/config/preset/add";
import PresetEditView from "@/components/config/preset/edit";
import PresetListView from "@/components/config/preset/list";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { deepCopy } from "@/utils";
import { useCallback, useEffect, useState } from "preact/hooks";

import "./mgmt.scss";

const PresetManagement = () => {
  const [presets, setPresets] = useState<any[]>();
  const [templates, setTemplates] = useState<object>();
  const [savedPrompts, setSavedPrompts] = useState<object>();
  const [rest, setRest] = useState<object>();
  const [editIndex, setEditIndex] = useState(-1);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  const handleBackup = useCallback(() => {
    axios
      .post("/api/config/backup")
      .then((r) => r.data)
      .then(({ path }) => {
        toaster.create({
          title: "Backed-up",
          description: path,
          type: "success",
        });
      });
  }, []);

  const handleSave = useCallback(() => {
    const consolidated = {
      presets,
      templates,
      saved_prompts: savedPrompts,
      ...rest,
    };
    return axios
      .put("/api/config", consolidated)
      .then((r) => r.data)
      .then(() => {
        toaster.create({
          title: "Saved",
          type: "success",
        });
      })
      .catch((e) => {
        console.error(e);
        toaster.create({
          title: "Error",
          description: "Check console logs",
          type: "error",
        });
      });
  }, [presets, templates, savedPrompts, rest]);

  const handleAdd = useCallback((refIndex: number) => {
    if (refIndex >= 0) {
      setPresets((prevPresets) => {
        const refPreset = prevPresets[refIndex];
        const { preset_name, ...rest } = refPreset;
        return [
          ...prevPresets,
          {
            ...rest,
            preset_name: `${preset_name} Copy`,
          },
        ];
      });
    } else {
      setPresets((prevPresets) => [...prevPresets, { preset_name: "New" }]);
    }
    handleSave();
    setAddDialogOpen(false);
  }, []);

  useEffect(() => {
    axios
      .get("/api/config")
      .then((r) => r.data)
      .then(({ templates, saved_prompts: savedPrompts, presets, ...rest }) => {
        setPresets(presets);
        setTemplates(templates);
        setSavedPrompts(savedPrompts);
        setRest(rest);
      });
  }, []);

  if (!presets) {
    return <div>Loading...</div>;
  }

  if (editIndex >= 0) {
    return (
      <PresetEditView
        preset={deepCopy(presets[editIndex])}
        onSave={(updated) => {
          setPresets((prevPresets) => {
            prevPresets.splice(editIndex, 1, updated);
            return prevPresets;
          });
          handleSave().then(() => {
            setEditIndex(-1);
          });
        }}
        onDelete={() => {
          setEditIndex(-1);
          setPresets((prevPresets) => {
            prevPresets.splice(editIndex, 1);
            return prevPresets;
          });
          handleSave();
        }}
        onCancel={() => setEditIndex(-1)}
      />
    );
  }

  return (
    <div>
      <AddDialog
        presets={presets}
        isOpen={isAddDialogOpen}
        onAdd={handleAdd}
        onCancel={() => setAddDialogOpen(false)}
      />
      <Button onClick={handleBackup}>Backup</Button>
      <Button onClick={() => setAddDialogOpen(true)}>Add</Button>
      <PresetListView presets={presets} setEditIndex={setEditIndex} />
    </div>
  );
};

export default PresetManagement;

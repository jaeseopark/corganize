import { axios } from "@/api";
import PresetEditView from "@/components/config/preset/edit";
import PresetTableView from "@/components/config/preset/table";
import TemplateTableView from "@/components/config/template/table";
import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { deepCopy } from "@/utils";
import { Box } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import "./mgmt.scss";

const TEMPLATE_TABLE_VIEW_ENABLED = false;

const ConfigManagement = () => {
  const [presets, setPresets] = useState<any[]>();
  const [templates, setTemplates] = useState<object>();
  const [savedPrompts, setSavedPrompts] = useState<object>();
  const [rest, setRest] = useState<object>();
  const isReady = useRef(false);
  const [presetEditIndex, setPresetEditIndex] = useState(-1);
  const [templateEditIndex, setTemplateEditIndex] = useState(-1);

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

  useEffect(() => {
    if (!isReady.current) {
      return;
    }

    const consolidated = {
      presets,
      templates,
      saved_prompts: savedPrompts,
      ...rest,
    };
    axios
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

  const handleAdd = useCallback(() => {
    setPresets((prevPresets) => [
      ...prevPresets,
      {
        preset_name: "New",
        model: "default",
        templates: [],
        loras: [
          {
            file: "",
            weight: 1,
          },
        ],
        prompt_elements: [],
        prompt: "",
        notes: "",
      },
    ]);
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
        isReady.current = true;
      });
  }, []);

  if (!rest) {
    // 'rest' is the last state to be set in the initial data load.
    return <div>Loading...</div>;
  }

  if (presetEditIndex >= 0) {
    return (
      <PresetEditView
        preset={deepCopy(presets[presetEditIndex])}
        templates={templates}
        onSave={(updated) => {
          setPresetEditIndex(-1);
          setPresets((prevPresets) => {
            prevPresets.splice(presetEditIndex, 1, updated);
            return [...prevPresets];
          });
        }}
        onDelete={() => {
          setPresetEditIndex(-1);
          setPresets((prevPresets) => {
            prevPresets.splice(presetEditIndex, 1);
            return [...prevPresets];
          });
        }}
        onCancel={() => setPresetEditIndex(-1)}
      />
    );
  }

  if (templateEditIndex >= 0) {
    return <div>template edit view here</div>;
  }

  return (
    <Box padding="4em">
      <Button onClick={handleBackup}>Backup</Button>
      <Button onClick={handleAdd}>Add</Button>
      <AccordionRoot collapsible defaultValue={["presets"]}>
        <AccordionItem value="presets">
          <AccordionItemTrigger>Presets</AccordionItemTrigger>
          <AccordionItemContent>
            <PresetTableView presets={presets} setEditIndex={setPresetEditIndex} showWeightPerc />
          </AccordionItemContent>
        </AccordionItem>
        {TEMPLATE_TABLE_VIEW_ENABLED && (
          <AccordionItem value="templates">
            <AccordionItemTrigger>Templates</AccordionItemTrigger>
            <AccordionItemContent>
              <TemplateTableView templates={templates} setEditIndex={setTemplateEditIndex} />
            </AccordionItemContent>
          </AccordionItem>
        )}
      </AccordionRoot>
    </Box>
  );
};

export default ConfigManagement;

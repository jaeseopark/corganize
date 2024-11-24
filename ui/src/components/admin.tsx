import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { subscribe, unsubscribe } from "@/ws";
import { Flex, Textarea } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "preact/hooks";

const Admin = () => {
  const [config, setConfig] = useState<string>("");
  const [isReady, setReady] = useState(false);

  const handleSave = useCallback(() => {
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config);
    } catch (e) {
      toaster.create({
        title: "Invalid JSON format",
        type: "error",
      });
      return;
    }

    fetch("/api/config", {
      method: "put",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedConfig),
    }).then(() => {
      toaster.create({
        title: "Saved",
        type: "success",
      });
    });
  }, [config]);

  const handleChangeNotes = useCallback((event) => {
    setConfig(event.target.value);
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((value) => {
        setConfig(JSON.stringify(value, null, 2));
        setReady(true);
      });

    const listener = (message) => {
      toaster.create({
        title: message.topic,
        description: JSON.stringify(message.payload),
        type: "info",
      });
      console.log(message);
    };

    subscribe(listener);

    return () => {
      unsubscribe(listener);
    };
  }, []);

  return (
    <Flex direction="column" width="100%" height="100%" gap="4" padding="1em">
      <Textarea disabled={!isReady} onChange={handleChangeNotes} height="100%">
        {config}
      </Textarea>
      <Button onClick={handleSave} disabled={!isReady}>
        Save
      </Button>
    </Flex>
  );
};

export default Admin;

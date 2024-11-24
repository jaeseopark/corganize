import { axios, subscribe, unsubscribe } from "@/api";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { Flex, Textarea } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "preact/hooks";

const Admin = () => {
  const [envvars, setEnvvars] = useState<string>("");
  const [isReady, setReady] = useState(false);

  const handleSave = useCallback(() => {
    let parsedEnvvars;
    try {
      parsedEnvvars = JSON.parse(envvars);
    } catch (e) {
      toaster.create({
        title: "Invalid JSON format",
        type: "error",
      });
      return;
    }

    axios
      .put("/api/envvars", parsedEnvvars, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((r) => {
        toaster.create({
          title: "Saved",
          type: "success",
        });
      })
      .catch((error) => {
        console.error(error);
        toaster.create({
          title: "Error",
          description: "Something went wrong. check console logs.",
          type: "error",
        });
      });
  }, [envvars]);

  const handleChangeNotes = useCallback((event) => {
    setEnvvars(event.target.value);
  }, []);

  useEffect(() => {
    axios
      .get("/api/envvars")
      .then((r) => r.data)
      .then((value) => {
        setEnvvars(JSON.stringify(value, null, 2));
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
        {envvars}
      </Textarea>
      <Button onClick={handleSave} disabled={!isReady}>
        Save
      </Button>
    </Flex>
  );
};

export default Admin;

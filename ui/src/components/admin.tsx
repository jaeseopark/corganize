import { axios, subscribe, unsubscribe } from "@/api";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { Box, Flex } from "@chakra-ui/react";
import { JsonEditor as Editor } from "jsoneditor-react";
import { useCallback, useEffect, useState } from "preact/hooks";

const Admin = () => {
  const [envvars, setEnvvars] = useState<any>();
  const [isReady, setReady] = useState(false);

  const handleSave = useCallback(() => {
    axios
      .put("/api/envvars", envvars, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(() => {
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

  useEffect(() => {
    axios
      .get("/api/envvars")
      .then((r) => r.data)
      .then((value) => {
        setEnvvars(value);
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

  if (!isReady) {
    return <Box>Loading...</Box>
  }

  return (
    <Flex direction="column" width="100%" height="100%" gap="4" padding="1em">
      <Editor value={envvars} onChange={setEnvvars} />
      <Button onClick={handleSave} disabled={!isReady}>
        Save
      </Button>
    </Flex>
  );
};

export default Admin;

import { Button } from "@/components/ui/button";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Textarea } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "preact/hooks";

const Admin = () => {
  const [notes, setNotes] = useState("");
  const [isReady, setReady] = useState(false);

  const handleSave = useCallback(() => {
    fetch("/api/notes", {
      method: "put",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: notes,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        toaster.create({
          title: "Saved",
          type: "success",
        });
      });
  }, [notes]);

  const handleChangeNotes = useCallback((event) => {
    setNotes(event.target.value);
  }, []);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then(({ value }) => {
        setNotes(value);
        setReady(true);
      });
  }, []);

  return (
    <div>
      <Toaster />
      <Textarea disabled={!isReady} onChange={handleChangeNotes}>
        {notes}
      </Textarea>
      <Button onClick={handleSave} disabled={!isReady}>
        Save
      </Button>
    </div>
  );
};

export default Admin;

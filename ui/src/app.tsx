import { useEffect, useState } from "preact/hooks";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Center, VStack } from "@chakra-ui/react";

import "./app.css";

type Image = {
  filename: string;
  isActive: boolean;
  // created: number;
};

function Home() {
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    setTimeout(() => {
      // one-time data load
      fetch("/api/images")
        .then((r) => r.json())
        .then(({ filenames }: { filenames: string[] }) => {
          setImages(filenames.map((filename) => ({ filename, isActive: true })));
        });
    }, 100);
  }, []);

  return (
    <>
      <Center>
        <VStack>
          {images.map((image) => {
            // todo: consider isActive
            return <img src={image.filename} />;
          })}
        </VStack>
      </Center>
    </>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

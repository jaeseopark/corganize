import { Center, VStack } from "@chakra-ui/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./app.css";

function Home() {
  return (
    <>
      <Center>
        <VStack>
          <h1>Vite + Preact</h1>
          <div>Ready!</div>
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

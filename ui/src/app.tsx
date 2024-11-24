import { axios } from "@/api";
import Admin from "@/components/admin";
import Gallery from "@/components/gallery";
import Login from "@/components/login";
import { useEffect, useState } from "preact/hooks";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./app.css";

const App = () => {
  const [attempted, setAttempted] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    axios
      .get("/api/config")
      .then((r) => {
        setAuthenticated(true);
        setAttempted(true);
      })
      .catch((error) => {
        console.error(error);
        setAttempted(true);
      });
  }, []);

  if (!attempted) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Login />} />
        {isAuthenticated && (
          <>
            <Route path="/gallery" element={<Gallery fileFetchUrl="/api/images/shuffled" />} />
            <Route path="/gallery/recent" element={<Gallery fileFetchUrl="/api/images/recent" />} />
            <Route path="/admin" element={<Admin />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
